// Order routes — place order, list my orders, list vendor received,
// update status (vendor for own orders, admin for any).
//
// Schema notes (see prisma/schema.prisma):
//   Order: userId, status, totalQty, subtotal, delivery, discount, total,
//          note, paymentMethod, customerName, customerPhone, customerAddress,
//          createdAt, updatedAt
//   OrderItem: orderId, productId, productName, productIcon, vendorName,
//              unitPrice, qty, lineTotal
//   Stall: ownerId (1:1 with User)

const { Router } = require('express');
const { body, param } = require('express-validator');
const prisma = require('../lib/prisma');
const { requireAuth, requireRole } = require('../lib/auth');
const { runValidation } = require('../lib/validate');
const { summarize, unitPrice } = require('../lib/pricing');
const { serializeOrder } = require('../lib/orderSerializer');

const router = Router();

const ITEM_INCLUDE = {
  include: {
    product: {
      select: {
        id: true,
        name: true,
        imageUrl: true,
        category: { select: { id: true, slug: true, name: true, icon: true } },
        stall: { select: { id: true, slug: true, name: true, emoji: true, location: true } },
      },
    },
  },
};

const ORDER_INCLUDE = {
  items: ITEM_INCLUDE,
  user: { select: { id: true, name: true, phone: true, city: true } },
};

function fullOrderQuery(extraWhere = {}) {
  return {
    where: extraWhere,
    orderBy: { createdAt: 'desc' },
    include: ORDER_INCLUDE,
  };
}

// Translate inbound payload (frontend uses "address"/"phone"/"notes") into
// the schema's customerName/customerPhone/customerAddress/note fields.
function pickCheckout(req, user) {
  const { address, phone, notes, paymentMethod } = req.body || {};
  return {
    customerName: user ? user.name : null,
    customerPhone: phone ? String(phone).trim() : (user && user.phone) || null,
    customerAddress: address ? String(address).trim() : (user && user.address) || null,
    note: notes ? String(notes).trim() : null,
    paymentMethod: paymentMethod || 'COD',
  };
}

// GET /api/orders/vendor/inbox  (declared BEFORE /:id so "vendor" isn't treated as an id)
router.get(
  '/vendor/inbox',
  requireAuth,
  requireRole('VENDOR', 'ADMIN'),
  async (req, res, next) => {
    try {
      let stall = null;
      const where = {};
      if (req.user.role === 'VENDOR') {
        stall = await prisma.stall.findUnique({ where: { ownerId: req.user.id } });
        if (!stall) {
          return res.json({ stall: null, orders: [] });
        }
        where.items = { some: { product: { stallId: stall.id } } };
      }
      const orders = await prisma.order.findMany(fullOrderQuery(where));
      res.json({
        stall: stall
          ? {
              id: stall.id,
              slug: stall.slug,
              name: stall.name,
              emoji: stall.emoji,
              location: stall.location,
              rating: stall.rating,
              totalSales: stall.totalSales,
            }
          : null,
        orders: orders.map((o) =>
          serializeOrder(o, { items: o.items, customer: o.user })
        ),
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/orders  — place order from current cart
router.post(
  '/',
  requireAuth,
  requireRole('CUSTOMER', 'ADMIN'),
  [
    body('address').isString().isLength({ min: 5, max: 240 }),
    body('phone').isString().isLength({ min: 6, max: 24 }),
    body('notes').optional().isString().isLength({ max: 240 }),
    body('paymentMethod').optional().isIn(['COD', 'BKASH', 'NAGAD']),
  ],
  runValidation,
  async (req, res, next) => {
    try {
      const cart = await prisma.cartItem.findMany({
        where: { userId: req.user.id },
        include: { product: { include: { stall: true } } },
      });
      if (cart.length === 0) {
        return res.status(400).json({ error: 'Your cart is empty' });
      }

      // Stock check
      for (const ci of cart) {
        if (!ci.product.isActive) {
          return res.status(400).json({
            error: `Product "${ci.product.name}" is no longer available`,
          });
        }
        if (ci.product.stock < ci.qty) {
          return res.status(400).json({
            error: `Only ${ci.product.stock} of "${ci.product.name}" left in stock`,
          });
        }
      }

      const pricing = summarize(
        cart.map((i) => ({ product: i.product, quantity: i.qty }))
      );
      if (pricing.itemCount === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
      }

      const checkout = pickCheckout(req, req.user);

      const order = await prisma.$transaction(async (tx) => {
        const o = await tx.order.create({
          data: {
            userId: req.user.id,
            status: 'PROCESSING',
            customerName: checkout.customerName,
            customerPhone: checkout.customerPhone,
            customerAddress: checkout.customerAddress,
            note: checkout.note,
            paymentMethod: checkout.paymentMethod,
            totalQty: pricing.itemCount,
            subtotal: pricing.subtotal,
            discount: pricing.discount,
            delivery: pricing.delivery,
            total: pricing.total,
            items: {
              create: cart.map((ci) => {
                const unit = unitPrice(ci.product);
                const qty = ci.qty;
                return {
                  product: { connect: { id: ci.product.id } },
                  productName: ci.product.name,
                  productIcon: ci.product.badge || null,
                  vendorName: ci.product.stall ? ci.product.stall.name : 'Unknown',
                  unitPrice: unit,
                  qty,
                  lineTotal: unit * qty,
                };
              }),
            },
          },
          include: { items: true },
        });

        // Decrement stock + bump sales counters.
        for (const ci of cart) {
          await tx.product.update({
            where: { id: ci.product.id },
            data: {
              stock: { decrement: ci.qty },
              sales: { increment: ci.qty },
            },
          });
          if (ci.product.stallId) {
            await tx.stall.update({
              where: { id: ci.product.stallId },
              data: { totalSales: { increment: ci.qty } },
            });
          }
        }

        // Clear the cart.
        await tx.cartItem.deleteMany({ where: { userId: req.user.id } });

        return o;
      });

      const full = await prisma.order.findUnique({
        where: { id: order.id },
        include: ORDER_INCLUDE,
      });

      // Surface the pricing-engine's freeItemName on the create response only.
      const payload = serializeOrder(full, { items: full.items, customer: full.user });
      payload.freeItemName = pricing.freeItemName || null;
      res.status(201).json({ order: payload });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/orders  — customer's own orders
router.get('/', requireAuth, requireRole('CUSTOMER', 'ADMIN'), async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany(fullOrderQuery({ userId: req.user.id }));
    res.json({
      orders: orders.map((o) => serializeOrder(o, { items: o.items, customer: o.user })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id  — customer (own) / vendor (own stall) / admin (any)
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: ORDER_INCLUDE,
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const role = req.user.role;
    const isOwner = order.userId === req.user.id;
    const isAdmin = role === 'ADMIN';
    let isVendor = false;
    if (role === 'VENDOR') {
      const stall = await prisma.stall.findUnique({ where: { ownerId: req.user.id } });
      isVendor = !!stall && order.items.some((oi) => oi.product?.stall?.id === stall.id);
    }

    if (!isOwner && !isAdmin && !isVendor) {
      return res.status(403).json({ error: 'Not allowed' });
    }

    res.json({
      order: serializeOrder(order, { items: order.items, customer: order.user }),
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orders/:id/status  — vendor (own orders) / admin (any)
router.patch(
  '/:id/status',
  requireAuth,
  requireRole('VENDOR', 'ADMIN'),
  [
    param('id').isString().notEmpty(),
    body('status').isIn(['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  ],
  runValidation,
  async (req, res, next) => {
    try {
      const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: {
          items: { include: { product: { select: { stallId: true } } } },
        },
      });
      if (!order) return res.status(404).json({ error: 'Order not found' });

      if (req.user.role === 'VENDOR') {
        const stall = await prisma.stall.findUnique({ where: { ownerId: req.user.id } });
        const touches = order.items.some((oi) => oi.product?.stallId === stall?.id);
        if (!touches) return res.status(403).json({ error: 'Not allowed for this order' });
      }

      const updated = await prisma.order.update({
        where: { id: order.id },
        data: { status: req.body.status },
      });

      const full = await prisma.order.findUnique({
        where: { id: updated.id },
        include: ORDER_INCLUDE,
      });
      res.json({
        order: serializeOrder(full, { items: full.items, customer: full.user }),
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;