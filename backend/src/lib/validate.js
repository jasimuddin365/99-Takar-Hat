// Validation helpers — wraps express-validator's `validationResult` so route
// handlers can `await runValidation(req, res, next)` instead of repeating
// the same boilerplate.

const { validationResult } = require('express-validator');

function runValidation(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(400).json({
    error: 'Validation failed',
    details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
  });
}

module.exports = { runValidation };