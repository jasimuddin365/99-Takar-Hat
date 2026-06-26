// Category routes — public listing with product counts.

const router = require('express').Router();
const prisma = require('../lib/prisma');
const { serializeCategory } = require('../lib/serializers');

// GET /api/categories
router.get('/', async (_req, res, next) => {
  try {
    const cats = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { position: 'asc' },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });
    res.json({
      categories: cats.map((c) => serializeCategory(c, c._count.products)),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/categories/:slug
router.get('/:slug', async (req, res, next) => {
  try {
    const c = await prisma.category.findUnique({
      where: { slug: req.params.slug },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });
    if (!c) return res.status(404).json({ error: 'Category not found' });
    res.json({ category: serializeCategory(c, c._count.products) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;