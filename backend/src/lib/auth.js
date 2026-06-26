// Auth middleware — guards routes based on JWT cookie + role.
//   requireAuth   — must be logged in
//   requireRole   — must be one of the allowed roles
//   optionalAuth  — sets req.user if a valid token is present, otherwise passes through

const { verify } = require('./jwt');
const prisma = require('./prisma');

const COOKIE_NAME = 'taka_token';

function readToken(req) {
  if (req.cookies && req.cookies[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.slice(7);
  }
  return null;
}

async function loadUserFromToken(token) {
  try {
    const decoded = verify(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { stall: true },
    });
    if (!user || !user.isActive) return null;
    return user;
  } catch (_err) {
    return null;
  }
}

// Express v4 doesn't await async middleware automatically, so we wrap async
// middleware with a sync shell that forwards rejections to next(err). This
// keeps the middleware signature `(req, res, next) => any` while still being
// safe for async work.
function asyncMw(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

const requireAuth = asyncMw(async (req, res, next) => {
  const token = readToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const user = await loadUserFromToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  req.user = user;
  return next();
});

function requireRole(...roles) {
  return asyncMw(async (req, res, next) => {
    const token = readToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const user = await loadUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden — insufficient role' });
    }
    req.user = user;
    return next();
  });
}

const optionalAuth = asyncMw(async (req, _res, next) => {
  const token = readToken(req);
  if (token) {
    const user = await loadUserFromToken(token);
    if (user) req.user = user;
  }
  return next();
});

module.exports = { requireAuth, requireRole, optionalAuth, COOKIE_NAME };