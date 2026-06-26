// Wishlist routes — toggle add/remove, list.

const { Router } = require('express');
const { param } = require('express-validator');
const prisma = require('../lib/prisma');
const { requireAuth, requireRole } = require('../lib/auth');
const { runValidation } = require('../lib/validate');
const { serializeProduct } = require('../lib/serializers');

const router = Router();

// GET /api/wishlist
router.get('/', requireAuth, requireRole('CUSTOMER', 'ADMIN'), async (req, res, next) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: { product: { include: { category: true, stall: true } } },
    });
    res.json({
      items: items
        .filter((i) => i.product)
        .map((i) => ({
          id: i.id,
          productId: i.productId,
          addedAt: i.createdAt,
          product: serializeProduct(i.product),
        })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/wishlist/:productId  — toggle (add if missing, remove if present)
router.post(
  '/:productId',
  requireAuth,
  requireRole('CUSTOMER', 'ADMIN'),
  [param('productId').isString().notEmpty()],
  runValidation,
  async (req, res, next) => {
    try {
      const product = await prisma.product.findUnique({
        where: { id: req.params.productId },
      });
      if (!product) return res.status(404).json({ error: 'Product not found' });

      const existing = await prisma.wishlistItem.findUnique({
        where: { userId_productId: { userId: req.user.id, productId: product.id } },
      });
      if (existing) {
        await prisma.wishlistItem.delete({ where: { id: existing.id } });
        return res.json({ added: false, productId: product.id });
      }
      await prisma.wishlistItem.create({
        data: { userId: req.user.id, productId: product.id },
      });
      res.json({ added: true, productId: product.id });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/wishlist/:productId  — explicit remove
router.delete(
  '/:productId',
  requireAuth,
  requireRole('CUSTOMER', 'ADMIN'),
  [param('productId').isString().notEmpty()],
  runValidation,
  async (req, res, next) => {
    try {
      await prisma.wishlistItem
        .delete({
          where: { userId_productId: { userId: req.user.id, productId: req.params.productId } },
        })
        .catch(() => null);
      res.json({ added: false, productId: req.params.productId });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;