// Auth routes — register, login, logout, current-user.
// Cookie-based JWT auth. Cookie name matches `COOKIE_NAME` in lib/auth.js.

const router = require('express').Router();
const bcrypt = require('bcrypt');
const { body } = require('express-validator');

const prisma = require('../lib/prisma');
const { sign } = require('../lib/jwt');
const { runValidation } = require('../lib/validate');
const { requireAuth, COOKIE_NAME } = require('../lib/auth');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, matches JWT expiry
  path: '/',
};

function publicUser(u) {
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
    joined: u.joinedAt,
    isActive: u.isActive,
    stall: u.stall
      ? {
          id: u.stall.id,
          slug: u.stall.slug,
          name: u.stall.name,
          emoji: u.stall.emoji,
          location: u.stall.location,
        }
      : null,
  };
}

// ── POST /api/auth/register ──────────────────────────────────────
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('role')
      .optional()
      .isIn(['CUSTOMER', 'VENDOR', 'ADMIN'])
      .withMessage('Role must be CUSTOMER, VENDOR, or ADMIN'),
  ],
  runValidation,
  async (req, res, next) => {
    try {
      const { email, password, name, phone, city, address, role = 'CUSTOMER' } = req.body;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(409).json({ error: 'Email already registered' });

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const avatar = name.trim().charAt(0).toUpperCase();

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: name.trim(),
          avatar,
          phone,
          city,
          address,
          role,
        },
        include: { stall: true },
      });

      const token = sign({ id: user.id, role: user.role });
      res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
      return res.status(201).json({ user: publicUser(user), token });
    } catch (err) {
      return next(err);
    }
  }
);

// ── POST /api/auth/login ─────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  runValidation,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
        include: { stall: true },
      });
      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = sign({ id: user.id, role: user.role });
      res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
      return res.json({ user: publicUser(user), token });
    } catch (err) {
      return next(err);
    }
  }
);

// ── POST /api/auth/logout ────────────────────────────────────────
router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTIONS, maxAge: 0 });
  res.json({ ok: true });
});

// ── GET /api/auth/me ─────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

module.exports = router;