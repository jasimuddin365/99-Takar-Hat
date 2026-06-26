// JWT helpers — sign and verify tokens used for stateless cookie-based auth.
// Tokens are stored in an httpOnly cookie by the route layer.

const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function sign(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

function verify(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { sign, verify };