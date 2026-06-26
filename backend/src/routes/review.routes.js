// Customer-facing review routes — submit and list for a product.

const { Router } = require('express');
const { body, param } = require('express-validator');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../lib/auth');
const { runValidation } = require('../lib/validate');
const { serializeReview } = require('../lib/serializers');

const router = Router({ mergeParams: true });

// GET /api/products/:id/reviews
router.get(
  '/:id/reviews',
  [param('id').isString().notEmpty()],
  runValidation,
  async (req, res, next) => {
    try {
      const product = await prisma.product.findUnique({ where: { id: req.params.id } });
      if (!product) return res.status(404).json({ error: 'Product not found' });

      const reviews = await prisma.review.findMany({
        where: { productId: product.id },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      });
      res.json({ reviews: reviews.map(serializeReview) });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/products/:id/reviews  — only verified buyers can review
router.post(
  '/:id/reviews',
  requireAuth,
  [
    param('id').isString().notEmpty(),
    body('stars').isInt({ min: 1, max: 5 }),
    body('text').optional().isString().isLength({ max: 500 }),
  ],
  runValidation,
  async (req, res, next) => {
    try {
      const product = await prisma.product.findUnique({ where: { id: req.params.id } });
      if (!product) return res.status(404).json({ error: 'Product not found' });

      const purchased = await prisma.orderItem.findFirst({
        where: { productId: product.id, order: { userId: req.user.id } },
      });
      if (!purchased) {
        return res.status(403).json({ error: 'You can only review products you have purchased' });
      }

      const review = await prisma.review.upsert({
        where: {
          userId_productId: { userId: req.user.id, productId: product.id },
        },
        create: {
          userId: req.user.id,
          productId: product.id,
          stars: Number(req.body.stars),
          text: (req.body.text || '').trim() || null,
        },
        update: {
          stars: Number(req.body.stars),
          text: (req.body.text || '').trim() || null,
        },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      });

      // Recompute product rating average.
      const agg = await prisma.review.aggregate({
        where: { productId: product.id },
        _avg: { stars: true },
        _count: { _all: true },
      });
      await prisma.product.update({
        where: { id: product.id },
        data: { rating: Math.round((agg._avg.stars || 0) * 10) / 10 },
      });

      res.status(201).json({ review: serializeReview(review) });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/products/:id/reviews  — author or admin removes their own
router.delete(
  '/:id/reviews',
  requireAuth,
  [param('id').isString().notEmpty()],
  runValidation,
  async (req, res, next) => {
    try {
      const review = await prisma.review.findUnique({
        where: {
          userId_productId: {
            userId: req.user.id,
            productId: req.params.id,
          },
        },
      });
      if (!review && req.user.role !== 'ADMIN') {
        return res.status(404).json({ error: 'Review not found' });
      }
      if (review) {
        await prisma.review.delete({ where: { id: review.id } });
      } else if (req.user.role === 'ADMIN') {
        // Admin can target any review via query ?userId=
        const userId = String(req.query.userId || '');
        if (userId) {
          await prisma.review
            .delete({
              where: { userId_productId: { userId, productId: req.params.id } },
            })
            .catch(() => null);
        }
      }

      // Recompute rating.
      const agg = await prisma.review.aggregate({
        where: { productId: req.params.id },
        _avg: { stars: true },
      });
      await prisma.product.update({
        where: { id: req.params.id },
        data: { rating: Math.round((agg._avg.stars || 0) * 10) / 10 },
      });
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;