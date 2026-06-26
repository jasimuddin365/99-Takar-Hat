// Multer-based image upload helper. Stores files under /uploads with a
// random suffix so names don't collide. Static-served by server.js.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
const MAX_MB = parseInt(process.env.MAX_UPLOAD_MB, 10) || 5;

// Ensure the uploads directory exists on first import, and seed a placeholder
// so product images render even before any vendor uploads anything.
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
const PLACEHOLDER = path.join(UPLOAD_DIR, 'placeholder.svg');
if (!fs.existsSync(PLACEHOLDER)) {
  const src = path.resolve(__dirname, '..', '..', 'public', 'placeholder.svg');
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, PLACEHOLDER);
  } else {
    fs.writeFileSync(
      PLACEHOLDER,
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#F5EBD3"/><text x="100" y="108" text-anchor="middle" font-size="22" font-family="Georgia" fill="#C8921A">৳99</text></svg>'
    );
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 8);
    const safe = crypto.randomBytes(8).toString('hex');
    cb(null, `${Date.now()}-${safe}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image uploads are allowed'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
});

module.exports = { upload, UPLOAD_DIR };