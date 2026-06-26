// Entry point — wires middleware, mounts route modules, starts the server.
// Routes are added module-by-module in Modules 3-6.
require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { UPLOAD_DIR } = require('./lib/upload');

const app = express();

// ── Security & parsing ───────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Health check ─────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: '99-taka-bazaar-api', time: new Date().toISOString() });
});

// Static uploads (product images)
app.use(
  '/uploads',
  express.static(UPLOAD_DIR, { fallthrough: true, maxAge: '7d' })
);

// ── Routes (mounted module by module) ────────────────────────────
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/vendors', require('./routes/vendor.routes'));
app.use('/api/cart', require('./routes/cart.routes'));
app.use('/api/wishlist', require('./routes/wishlist.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/products', require('./routes/review.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// ── 404 + global error handler ───────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error('[error]', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// ── Start ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`✓ 99 Taka Bazaar API running on http://localhost:${PORT}`);
});

module.exports = app;