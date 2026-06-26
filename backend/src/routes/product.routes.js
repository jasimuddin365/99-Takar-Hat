// Product routes
// Public: GET /, GET /:id
// Vendor: POST /, PUT /:id, DELETE /:id (own stall only)

const path = require('path');
const { Router } = require('express');
const { body } = require('express-validator');
const prisma = require('../lib/prisma');
const { requireAuth, requireRole } = require('../lib/auth');
const { runValidation } = require('../lib/validate');
const { upload } = require('../lib/upload');
const {
  serializeProduct,
  serializeStall,
  serializeReview,
} = require('../lib/serializers');

const router = Router();

const DEFAULT_IMAGE = '/uploads/placeholder.svg';

// Build a public URL for an uploaded file.
function fileUrl(req, filename) {
  if (!filename) return DEFAULT_IMAGE;
  if (filename.startsWith('http')) return filename;
  if (filename.startsWith('/uploads/')) return filename;
  return `/uploads/${path.basename(filename)}`;
}

// Ensure the current user has a stall; auto-create one if missing (lazy provision).
async function ensureStallForUser(userId, name, email) {
  let stall = await prisma.stall.findUnique({ where: { ownerId: userId } });
  if (stall) return stall;

  const baseSlug = (name || email.split('@')[0])
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || `stall-${userId.slice(-6)}`;
  let slug = baseSlug;
  let n = 1;
  while (await prisma.stall.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${n++}`;
  }

  stall = await prisma.stall.create({
    data: {
      ownerId: userId,
      slug,
      name: `${name}'s Stall`,
      emoji: '🏪',
      description: 'New stall on the bazaar — start adding products!',
      location: 'Bangladesh',
      ownerName: name,
      since: String(new Date().getFullYear()),
    },
  });
  return stall;
}

// GET /api/products
// Query: cat=<slug>, vendor=<slug>, q=<text>, top=<bool>
router.get('/', async (req, res, next) => {
  try {
    const { cat, vendor, q } = req.query;
    const top = String(req.query.top || '').toLowerCase() === 'true';

    const where = { isActive: true };
    const and = [];

    if (cat) {
      const c = await prisma.category.findUnique({ where: { slug: String(cat) } });
      if (c) where.categoryId = c.id;
      else where.categoryId = '__none__'; // empty result
    }
    if (vendor) {
      const s = await prisma.stall.findUnique({ where: { slug: String(vendor) } });
      if (s) where.stallId = s.id;
      else where.stallId = '__none__';
    }
    if (q) {
      and.push({
        OR: [
          { name: { contains: String(q), mode: 'insensitive' } },
          { description: { contains: String(q), mode: 'insensitive' } },
        ],
      });
    }
    if (and.length) where.AND = and;

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: top ? { sales: 'desc' } : [{ createdAt: 'desc' }, { id: 'asc' }],
        take: 60,
        include: { category: true, stall: true },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      products: items.map(serializeProduct),
      total,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id  — detail with reviews + vendor info
router.get('/:id', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        stall: { include: { _count: { select: { products: { where: { isActive: true } } } } } },
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
      },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    res.json({
      product: serializeProduct({
        ...product,
        stall: { ...product.stall, _count: undefined },
      }),
      vendor: serializeStall(product.stall, product.stall._count.products),
      reviews: product.reviews.map(serializeReview),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/products  — VENDOR creates a product (with optional image)
router.post(
  '/',
  requireAuth,
  requireRole('VENDOR', 'ADMIN'),
  upload.single('image'),
  [
    body('name').isString().isLength({ min: 2, max: 120 }),
    body('description').optional().isString().isLength({ max: 800 }),
    body('categorySlug').isString().notEmpty(),
    body('stock').optional().isInt({ min: 0 }),
    body('discount').optional().isInt({ min: 0, max: 30 }),
    body('badge').optional().isString().isLength({ max: 30 }),
    body('price').optional().isFloat({ min: 1 }),
  ],
  runValidation,
  async (req, res, next) => {
    try {
      const user = req.user;
      const stall = await ensureStallForUser(user.id, user.name, user.email);

      const category = await prisma.category.findUnique({
        where: { slug: req.body.categorySlug },
      });
      if (!category) return res.status(400).json({ error: 'Unknown category' });

      const imageUrl = req.file ? fileUrl(req, req.file.filename) : DEFAULT_IMAGE;

      const product = await prisma.product.create({
        data: {
          name: req.body.name.trim(),
          description: (req.body.description || '').trim(),
          price: Math.round(Number(req.body.price || 99)),
          stock: Number(req.body.stock || 0),
          discount: Number(req.body.discount || 0),
          badge: (req.body.badge || '').trim() || null,
          imageUrl,
          stallId: stall.id,
          categoryId: category.id,
        },
        include: { category: true, stall: true },
      });

      res.status(201).json({ product: serializeProduct(product) });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/products/:id  — VENDOR updates own product
router.put(
  '/:id',
  requireAuth,
  requireRole('VENDOR', 'ADMIN'),
  upload.single('image'),
  [
    body('name').optional().isString().isLength({ min: 2, max: 120 }),
    body('description').optional().isString().isLength({ max: 800 }),
    body('categorySlug').optional().isString().notEmpty(),
    body('stock').optional().isInt({ min: 0 }),
    body('discount').optional().isInt({ min: 0, max: 30 }),
    body('badge').optional().isString().isLength({ max: 30 }),
    body('price').optional().isFloat({ min: 1 }),
    body('isActive').optional().isBoolean(),
  ],
  runValidation,
  async (req, res, next) => {
    try {
      const product = await prisma.product.findUnique({
        where: { id: req.params.id },
        include: { stall: true },
      });
      if (!product) return res.status(404).json({ error: 'Product not found' });

      if (req.user.role === 'VENDOR' && product.stall.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'You can only edit your own products' });
      }

      const data = {};
      if (req.body.name !== undefined) data.name = String(req.body.name).trim();
      if (req.body.description !== undefined)
        data.description = String(req.body.description).trim();
      if (req.body.price !== undefined) data.price = Math.round(Number(req.body.price));
      if (req.body.stock !== undefined) data.stock = Number(req.body.stock);
      if (req.body.discount !== undefined) data.discount = Number(req.body.discount);
      if (req.body.badge !== undefined) data.badge = String(req.body.badge).trim() || null;
      if (req.body.isActive !== undefined) data.isActive = Boolean(req.body.isActive);
      if (req.file) data.imageUrl = fileUrl(req, req.file.filename);
      if (req.body.categorySlug !== undefined) {
        const c = await prisma.category.findUnique({ where: { slug: req.body.categorySlug } });
        if (!c) return res.status(400).json({ error: 'Unknown category' });
        data.categoryId = c.id;
      }

      const updated = await prisma.product.update({
        where: { id: product.id },
        data,
        include: { category: true, stall: true },
      });
      res.json({ product: serializeProduct(updated) });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/products/:id  — VENDOR deletes own product (soft-delete via isActive)
router.delete(
  '/:id',
  requireAuth,
  requireRole('VENDOR', 'ADMIN'),
  async (req, res, next) => {
    try {
      const product = await prisma.product.findUnique({
        where: { id: req.params.id },
        include: { stall: true },
      });
      if (!product) return res.status(404).json({ error: 'Product not found' });
      if (req.user.role === 'VENDOR' && product.stall.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'You can only delete your own products' });
      }

      await prisma.product.update({
        where: { id: product.id },
        data: { isActive: false },
      });
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;