// Vendor / stall routes — public listing & detail, with product counts.

const router = require('express').Router();
const prisma = require('../lib/prisma');
const { serializeStall, serializeProduct } = require('../lib/serializers');

// GET /api/vendors  — optional ?q= search by name/location
router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const where = { isActive: true };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
      ];
    }
    const stalls = await prisma.stall.findMany({
      where,
      orderBy: { totalSales: 'desc' },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });
    res.json({ vendors: stalls.map((s) => serializeStall(s, s._count.products)) });
  } catch (err) {
    next(err);
  }
});

// GET /api/vendors/:slug — stall detail + top 8 products
router.get('/:slug', async (req, res, next) => {
  try {
    const stall = await prisma.stall.findUnique({
      where: { slug: req.params.slug },
      include: {
        _count: { select: { products: { where: { isActive: true } } } },
        products: {
          where: { isActive: true },
          orderBy: { sales: 'desc' },
          take: 8,
          include: { category: true, stall: true },
        },
      },
    });
    if (!stall) return res.status(404).json({ error: 'Vendor not found' });

    res.json({
      vendor: serializeStall(stall, stall._count.products),
      topProducts: stall.products.map(serializeProduct),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;