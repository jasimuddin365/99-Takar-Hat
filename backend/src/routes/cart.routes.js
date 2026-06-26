// Cart routes — add, list, update quantity, remove item.
// Customers only. Pricing summary computed via lib/pricing.js.

const { Router } = require('express');
const { body, param } = require('express-validator');
const prisma = require('../lib/prisma');
const { requireAuth, requireRole } = require('../lib/auth');
const { runValidation } = require('../lib/validate');
const { summarize } = require('../lib/pricing');
const { serializeProduct } = require('../lib/serializers');

const router = Router();

function expandCart(cartItems) {
  return cartItems.map((ci) => ({
    id: ci.id,
    productId: ci.productId,
    quantity: ci.qty,
    addedAt: ci.createdAt,
    product: ci.product,
  }));
}

async function pricingFor(userId) {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });
  const pricing = summarize(
    items.map((i) => ({ product: i.product, quantity: i.qty }))
  );
  return { items, pricing };
}

// GET /api/cart
router.get('/', requireAuth, requireRole('CUSTOMER', 'ADMIN'), async (req, res, next) => {
  try {
    const { items, pricing } = await pricingFor(req.user.id);
    res.json({
      items: expandCart(items).map((i) => ({
        ...i,
        product: serializeProduct(i.product),
      })),
      pricing,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/cart  { productId, quantity? }
router.post(
  '/',
  requireAuth,
  requireRole('CUSTOMER', 'ADMIN'),
  [
    body('productId').isString().notEmpty(),
    body('quantity').optional().isInt({ min: 1, max: 99 }),
  ],
  runValidation,
  async (req, res, next) => {
    try {
      const product = await prisma.product.findUnique({
        where: { id: req.body.productId },
      });
      if (!product || !product.isActive) {
        return res.status(404).json({ error: 'Product not available' });
      }

      const qty = Number(req.body.quantity || 1);
      const existing = await prisma.cartItem.findUnique({
        where: { userId_productId: { userId: req.user.id, productId: product.id } },
      });

      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { qty: Math.min(99, existing.qty + qty) },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            userId: req.user.id,
            productId: product.id,
            qty: Math.min(99, qty),
          },
        });
      }

      const { items, pricing } = await pricingFor(req.user.id);
      res.status(201).json({
        items: expandCart(items).map((i) => ({
          ...i,
          product: serializeProduct(i.product),
        })),
        pricing,
      });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/cart/:productId  { quantity }
router.patch(
  '/:productId',
  requireAuth,
  requireRole('CUSTOMER', 'ADMIN'),
  [
    param('productId').isString().notEmpty(),
    body('quantity').isInt({ min: 0, max: 99 }),
  ],
  runValidation,
  async (req, res, next) => {
    try {
      const qty = Number(req.body.quantity);
      if (qty === 0) {
        await prisma.cartItem
          .delete({
            where: { userId_productId: { userId: req.user.id, productId: req.params.productId } },
          })
          .catch(() => null);
      } else {
        const existing = await prisma.cartItem.findUnique({
          where: { userId_productId: { userId: req.user.id, productId: req.params.productId } },
        });
        if (!existing) {
          return res.status(404).json({ error: 'Cart item not found' });
        }
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { qty: qty },
        });
      }

      const { items, pricing } = await pricingFor(req.user.id);
      res.json({
        items: expandCart(items).map((i) => ({
          ...i,
          product: serializeProduct(i.product),
        })),
        pricing,
      });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/cart/:productId
router.delete(
  '/:productId',
  requireAuth,
  requireRole('CUSTOMER', 'ADMIN'),
  [param('productId').isString().notEmpty()],
  runValidation,
  async (req, res, next) => {
    try {
      await prisma.cartItem
        .delete({
          where: { userId_productId: { userId: req.user.id, productId: req.params.productId } },
        })
        .catch(() => null);
      const { items, pricing } = await pricingFor(req.user.id);
      res.json({
        items: expandCart(items).map((i) => ({
          ...i,
          product: serializeProduct(i.product),
        })),
        pricing,
      });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/cart — clear all
router.delete('/', requireAuth, requireRole('CUSTOMER', 'ADMIN'), async (req, res, next) => {
  try {
    await prisma.cartItem.deleteMany({ where: { userId: req.user.id } });
    res.json({ items: [], pricing: summarize([]) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;