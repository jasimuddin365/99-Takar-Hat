// Admin routes — moderation across users, vendors, products, orders,
// categories plus aggregate analytics. All routes require ADMIN role.

const { Router } = require('express');
const { body, param } = require('express-validator');
const prisma = require('../lib/prisma');
const { requireAuth, requireRole } = require('../lib/auth');
const { runValidation } = require('../lib/validate');
const {
  serializeProduct,
  serializeCategory,
  serializeStall,
  serializeReview,
} = require('../lib/serializers');

const router = Router();
router.use(requireAuth, requireRole('ADMIN'));

function publicUser(u, stall = null) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatar: u.avatar,
    phone: u.phone,
    city: u.city,
    address: u.address,
    role: u.role,
    isActive: u.isActive,
    joined: u.joinedAt,
    stall: stall ? serializeStall(stall) : null,
  };
}

// ─── Users ───────────────────────────────────────────────────────

// GET /api/admin/users?role=&q=
router.get('/users', async (req, res, next) => {
  try {
    const where = {};
    if (req.query.role) where.role = String(req.query.role);
    if (req.query.q) {
      where.OR = [
        { name: { contains: String(req.query.q), mode: 'insensitive' } },
        { email: { contains: String(req.query.q), mode: 'insensitive' } },
        { city: { contains: String(req.query.q), mode: 'insensitive' } },
      ];
    }
    const users = await prisma.user.findMany({
      where,
      orderBy: { joinedAt: 'desc' },
      include: { stall: true },
    });
    res.json({
      users: users.map((u) =>
        publicUser(u, u.role === 'VENDOR' ? u.stall : null)
      ),
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/users/:id  — toggle isActive, change role
router.patch(
  '/users/:id',
  [
    param('id').isString().notEmpty(),
    body('isActive').optional().isBoolean(),
    body('role').optional().isIn(['CUSTOMER', 'VENDOR', 'ADMIN']),
  ],
  runValidation,
  async (req, res, next) => {
    try {
      const u = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (!u) return res.status(404).json({ error: 'User not found' });
      const data = {};
      if (req.body.isActive !== undefined) data.isActive = Boolean(req.body.isActive);
      if (req.body.role !== undefined) data.role = req.body.role;
      const updated = await prisma.user.update({
        where: { id: u.id },
        data,
        include: { stall: true },
      });
      res.json({ user: publicUser(updated, updated.stall) });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Vendors (stalls) ────────────────────────────────────────────

router.get('/vendors', async (_req, res, next) => {
  try {
    const stalls = await prisma.stall.findMany({
      orderBy: { totalSales: 'desc' },
      include: { owner: true, _count: { select: { products: true } } },
    });
    res.json({
      vendors: stalls.map((s) => ({
        ...serializeStall(s, s._count.products),
        ownerEmail: s.owner ? s.owner.email : null,
        ownerActive: s.owner ? s.owner.isActive : false,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/vendors/:id',
  [
    param('id').isString().notEmpty(),
    body('isActive').optional().isBoolean(),
    body('name').optional().isString().isLength({ min: 2, max: 80 }),
    body('description').optional().isString().isLength({ max: 400 }),
    body('location').optional().isString().isLength({ max: 80 }),
  ],
  runValidation,
  async (req, res, next) => {
    try {
      const stall = await prisma.stall.findUnique({ where: { id: req.params.id } });
      if (!stall) return res.status(404).json({ error: 'Stall not found' });
      const data = {};
      if (req.body.isActive !== undefined) data.isActive = Boolean(req.body.isActive);
      if (req.body.name !== undefined) data.name = String(req.body.name).trim();
      if (req.body.description !== undefined)
        data.description = String(req.body.description).trim();
      if (req.body.location !== undefined)
        data.location = String(req.body.location).trim();
      const updated = await prisma.stall.update({
        where: { id: stall.id },
        data,
        include: { _count: { select: { products: true } } },
      });
      res.json({ vendor: serializeStall(updated, updated._count.products) });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Products ────────────────────────────────────────────────────

router.get('/products', async (req, res, next) => {
  try {
    const where = {};
    if (req.query.q) {
      where.OR = [
        { name: { contains: String(req.query.q), mode: 'insensitive' } },
        { description: { contains: String(req.query.q), mode: 'insensitive' } },
      ];
    }
    if (req.query.vendor) {
      const s = await prisma.stall.findUnique({ where: { slug: String(req.query.vendor) } });
      if (s) where.stallId = s.id;
      else where.stallId = '__none__';
    }
    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { category: true, stall: true },
      take: 200,
    });
    res.json({ products: products.map(serializeProduct) });
  } catch (err) {
    next(err);
  }
});

router.delete(
  '/products/:id',
  [param('id').isString().notEmpty()],
  runValidation,
  async (req, res, next) => {
    try {
      const p = await prisma.product.findUnique({ where: { id: req.params.id } });
      if (!p) return res.status(404).json({ error: 'Product not found' });
      await prisma.product.update({
        where: { id: p.id },
        data: { isActive: false },
      });
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Orders ──────────────────────────────────────────────────────

router.get('/orders', async (req, res, next) => {
  try {
    const where = {};
    if (req.query.status) where.status = String(req.query.status);
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                imageUrl: true,
                category: { select: { id: true, slug: true, name: true, icon: true } },
                stall: { select: { id: true, slug: true, name: true, emoji: true, location: true } },
              },
            },
          },
        },
        user: { select: { id: true, name: true, phone: true, city: true } },
      },
    });
    res.json({
      orders: orders.map((o) => ({
        id: o.id,
        status: o.status,
        address: o.customerAddress,
        phone: o.customerPhone,
        itemCount: o.totalQty,
        subtotal: o.subtotal,
        discount: o.discount,
        delivery: o.delivery,
        total: o.total,
        paymentMethod: o.paymentMethod,
        placedAt: o.createdAt,
        updatedAt: o.updatedAt,
        customer: o.user,
        itemPreview: o.items.slice(0, 3).map((i) => ({
          name: i.productName,
          quantity: i.qty,
          imageUrl: i.product?.imageUrl || null,
        })),
        itemTotal: o.items.length,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/orders/:id',
  [
    param('id').isString().notEmpty(),
    body('status').optional().isIn(['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  ],
  runValidation,
  async (req, res, next) => {
    try {
      const o = await prisma.order.findUnique({ where: { id: req.params.id } });
      if (!o) return res.status(404).json({ error: 'Order not found' });
      const data = {};
      if (req.body.status) data.status = req.body.status;
      const updated = await prisma.order.update({
        where: { id: o.id },
        data,
      });
      res.json({ order: { id: updated.id, status: updated.status, updatedAt: updated.updatedAt } });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Categories ──────────────────────────────────────────────────

router.get('/categories', async (_req, res, next) => {
  try {
    const cats = await prisma.category.findMany({
      orderBy: { position: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    res.json({ categories: cats.map((c) => serializeCategory(c, c._count.products)) });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/categories',
  [
    body('slug').isString().isLength({ min: 2, max: 40 }).matches(/^[a-z0-9-]+$/),
    body('name').isString().isLength({ min: 2, max: 60 }),
    body('icon').optional().isString().isLength({ max: 8 }),
    body('position').optional().toInt().isInt({ min: 0, max: 999 }),
  ],
  runValidation,
  async (req, res, next) => {
    try {
      const c = await prisma.category.create({
        data: {
          slug: req.body.slug,
          name: req.body.name,
          icon: req.body.icon || '🛍️',
          position: Number.isFinite(Number(req.body.position))
            ? Number(req.body.position)
            : 99,
        },
      });
      res.status(201).json({ category: serializeCategory(c) });
    } catch (err) {
      if (err.code === 'P2002') {
        return res.status(409).json({ error: 'Slug already exists' });
      }
      next(err);
    }
  }
);

router.patch(
  '/categories/:id',
  [
    param('id').isString().notEmpty(),
    body('name').optional().isString().isLength({ min: 2, max: 60 }),
    body('icon').optional().isString().isLength({ max: 8 }),
    body('position').optional().isInt({ min: 0, max: 999 }),
    body('isActive').optional().isBoolean(),
  ],
  runValidation,
  async (req, res, next) => {
    try {
      const c = await prisma.category.findUnique({ where: { id: req.params.id } });
      if (!c) return res.status(404).json({ error: 'Category not found' });
      const data = {};
      if (req.body.name !== undefined) data.name = req.body.name;
      if (req.body.icon !== undefined) data.icon = req.body.icon;
      if (req.body.position !== undefined) data.position = Number(req.body.position);
      if (req.body.isActive !== undefined) data.isActive = Boolean(req.body.isActive);
      const updated = await prisma.category.update({ where: { id: c.id }, data });
      res.json({ category: serializeCategory(updated) });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/categories/:id',
  [param('id').isString().notEmpty()],
  runValidation,
  async (req, res, next) => {
    try {
      const c = await prisma.category.findUnique({ where: { id: req.params.id } });
      if (!c) return res.status(404).json({ error: 'Category not found' });
      const used = await prisma.product.count({ where: { categoryId: c.id } });
      if (used > 0) {
        return res.status(400).json({
          error: `Category is used by ${used} product(s); deactivate instead`,
        });
      }
      await prisma.category.delete({ where: { id: c.id } });
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Analytics ───────────────────────────────────────────────────

router.get('/analytics', async (_req, res, next) => {
  try {
    const [
      userTotal,
      customers,
      vendors,
      admins,
      activeUsers,
      stalls,
      activeStalls,
      productTotal,
      activeProducts,
      categoryTotal,
      orderTotal,
      revenueAgg,
      ordersByStatusRaw,
      recentOrdersRaw,
      categoryPerfRaw,
      lowStockRaw,
      topVendorsRaw,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { role: 'VENDOR' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.stall.count(),
      prisma.stall.count({ where: { isActive: true } }),
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.category.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total: true, subtotal: true, discount: true, delivery: true },
        where: { status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] } },
      }),
      prisma.order.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { user: { select: { name: true } } },
      }),
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { position: 'asc' },
        include: {
          _count: { select: { products: true } },
          products: {
            select: { sales: true, price: true, discount: true },
          },
        },
      }),
      prisma.product.findMany({
        where: { isActive: true, stock: { lt: 10 } },
        orderBy: { stock: 'asc' },
        take: 10,
        include: { stall: { select: { name: true } } },
      }),
      prisma.stall.findMany({
        orderBy: { totalSales: 'desc' },
        take: 5,
      }),
    ]);

    const ordersByStatus = ordersByStatusRaw.reduce((acc, row) => {
      acc[row.status] = row._count._all;
      return acc;
    }, {});

    const categoryPerformance = categoryPerfRaw.map((c) => {
      const units = c.products.reduce((s, p) => s + (p.sales || 0), 0);
      const revenue = c.products.reduce(
        (s, p) =>
          s +
          (p.sales || 0) *
            Math.round((p.price || 99) * (1 - Math.min(30, p.discount || 0) / 100)),
        0
      );
      return {
        id: c.id,
        slug: c.slug,
        name: c.name,
        icon: c.icon,
        productCount: c._count.products,
        unitsSold: units,
        revenue,
      };
    });

    const deliveryStats = await prisma.order.aggregate({
      where: { status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] } },
      _sum: { delivery: true, discount: true },
      _count: { _all: true },
    });

    res.json({
      kpis: {
        users: userTotal,
        activeUsers,
        customers,
        vendors,
        admins,
        stalls,
        activeStalls,
        products: productTotal,
        activeProducts,
        categories: categoryTotal,
        orders: orderTotal,
        revenue: revenueAgg._sum.total || 0,
        grossSubtotal: revenueAgg._sum.subtotal || 0,
        discountsGiven: revenueAgg._sum.discount || 0,
        deliveryCollected: revenueAgg._sum.delivery || 0,
      },
      ordersByStatus,
      categoryPerformance,
      recentOrders: recentOrdersRaw.map((o) => ({
        id: o.id,
        total: o.total,
        status: o.status,
        placedAt: o.createdAt,
        customer: o.user ? o.user.name : 'Unknown',
      })),
      deliveryStats: {
        totalOrders: deliveryStats._count._all || 0,
        freeOrders: await prisma.order.count({
          where: { delivery: 0, status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] } },
        }),
        paidDelivery: await prisma.order.count({
          where: { delivery: 20, status: { in: ['PROCESSING', 'SHIPPED', 'DELIVERED'] } },
        }),
        totalDeliveryCollected: deliveryStats._sum.delivery || 0,
        totalDiscountGiven: deliveryStats._sum.discount || 0,
      },
      lowStock: lowStockRaw.map((p) => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        sales: p.sales,
        stallName: p.stall ? p.stall.name : 'Unknown',
      })),
      topVendors: topVendorsRaw.map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        emoji: s.emoji,
        location: s.location,
        rating: s.rating,
        totalSales: s.totalSales,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ─── Reviews (admin moderation) ─────────────────────────────────

router.get('/reviews', async (req, res, next) => {
  try {
    const where = {};
    if (req.query.productId) where.productId = String(req.query.productId);
    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        product: { select: { id: true, name: true, imageUrl: true } },
      },
    });
    res.json({
      reviews: reviews.map((r) => ({
        ...serializeReview(r),
        product: r.product
          ? { id: r.product.id, name: r.product.name, imageUrl: r.product.imageUrl }
          : null,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.delete(
  '/reviews/:id',
  [param('id').isString().notEmpty()],
  runValidation,
  async (req, res, next) => {
    try {
      const r = await prisma.review.findUnique({ where: { id: req.params.id } });
      if (!r) return res.status(404).json({ error: 'Review not found' });
      await prisma.review.delete({ where: { id: r.id } });
      // recompute product rating
      const agg = await prisma.review.aggregate({
        where: { productId: r.productId },
        _avg: { stars: true },
      });
      await prisma.product.update({
        where: { id: r.productId },
        data: { rating: Math.round((agg._avg.stars || 0) * 10) / 10 },
      });
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;