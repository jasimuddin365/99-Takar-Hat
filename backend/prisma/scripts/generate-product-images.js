// Generate themed SVG product cards for every (category, productName) pair in
// seed-data.js. Writes 600x600 SVGs to backend/uploads/products/ and prints a
// JSON map { "<categorySlug>|<productName>": "/uploads/products/<file>.svg" }
// to stdout so the seeder (or a manual pipeline) can wire imageUrl values.
//
// Run: node backend/prisma/scripts/generate-product-images.js

const fs = require('fs');
const path = require('path');
const { CATEGORIES } = require('../seed-data');

const OUT_DIR = path.resolve(__dirname, '..', '..', 'uploads', 'products');

// Two-stop gradient + accent pair per category. Tuned so each category has its
// own hue family — products in the same category share a palette, products in
// different categories are clearly distinguishable on the home grid.
const CATEGORY_THEME = {
  food:         { c1: '#fef3c7', c2: '#fde68a', accent: '#f59e0b', glow: '#fbbf24' },
  beauty:       { c1: '#fce7f3', c2: '#fbcfe8', accent: '#ec4899', glow: '#f472b6' },
  fashion:      { c1: '#e0e7ff', c2: '#c7d2fe', accent: '#6366f1', glow: '#818cf8' },
  home:         { c1: '#dcfce7', c2: '#bbf7d0', accent: '#16a34a', glow: '#4ade80' },
  kitchen:      { c1: '#ffedd5', c2: '#fed7aa', accent: '#ea580c', glow: '#fb923c' },
  books:        { c1: '#ede9fe', c2: '#ddd6fe', accent: '#7c3aed', glow: '#a78bfa' },
  electronics:  { c1: '#cffafe', c2: '#a5f3fc', accent: '#0891b2', glow: '#22d3ee' },
  health:       { c1: '#fee2e2', c2: '#fecaca', accent: '#dc2626', glow: '#f87171' },
  baby:         { c1: '#fef9c3', c2: '#fef08a', accent: '#ca8a04', glow: '#facc15' },
  garden:       { c1: '#d1fae5', c2: '#a7f3d0', accent: '#059669', glow: '#34d399' },
  sports:       { c1: '#dbeafe', c2: '#bfdbfe', accent: '#2563eb', glow: '#60a5fa' },
  pet:          { c1: '#fce7f3', c2: '#fbcfe8', accent: '#db2777', glow: '#f472b6' },
  auto:         { c1: '#e2e8f0', c2: '#cbd5e1', accent: '#475569', glow: '#94a3b8' },
  mobile:       { c1: '#cffafe', c2: '#a5f3fc', accent: '#0e7490', glow: '#06b6d4' },
  gifts:        { c1: '#fae8ff', c2: '#f5d0fe', accent: '#a21caf', glow: '#e879f9' },
};

function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

// SVG-safe text escape for XML attributes/text nodes.
function escXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Break a product name into roughly 2-3 lines for the card label.
function wrapText(name, maxLine = 14) {
  const words = name.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxLine && line) {
      lines.push(line.trim());
      line = w;
    } else {
      line = (line ? line + ' ' : '') + w;
    }
  }
  if (line) lines.push(line.trim());
  // Hard-cap to 3 lines, ellipsize overflow.
  if (lines.length > 3) {
    lines.length = 3;
    lines[2] = lines[2].replace(/\s*\S{0,5}$/, '') + '…';
  }
  return lines;
}

// Deterministic per-product palette jitter so two "Biscuit" entries in
// different positions get visually distinct cards even within one category.
function jitter(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function buildSvg({ categorySlug, categoryName, categoryIcon, productName, index }) {
  const theme = CATEGORY_THEME[categorySlug] || CATEGORY_THEME.food;
  const rand = jitter(index * 9301 + 49297);

  // Decorative shapes — circles in accent + glow colors, positioned by RNG so
  // each card has a unique composition.
  const blobs = [];
  for (let i = 0; i < 5; i++) {
    const cx = Math.floor(rand() * 600);
    const cy = Math.floor(rand() * 600);
    const r = 40 + Math.floor(rand() * 90);
    const fill = i % 2 === 0 ? theme.glow : theme.accent;
    const op = 0.08 + rand() * 0.15;
    blobs.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${op.toFixed(2)}"/>`);
  }

  const lines = wrapText(productName, 14);
  const startY = 430 - (lines.length - 1) * 28;

  const lineNodes = lines
    .map(
      (ln, i) =>
        `<text x="300" y="${startY + i * 56}" text-anchor="middle" ` +
        `font-family="Inter, system-ui, -apple-system, Segoe UI, sans-serif" ` +
        `font-size="44" font-weight="700" fill="#0f172a">${escXml(ln)}</text>`
    )
    .join('');

  // Strip emoji variation selectors so they render reliably in <text> nodes.
  const glyph = categoryIcon.replace(/[\uFE0F\u200D]/g, '');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${theme.c1}"/>
      <stop offset="100%" stop-color="${theme.c2}"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="42%" r="40%">
      <stop offset="0%" stop-color="${theme.glow}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${theme.glow}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="600" height="600" fill="url(#bg)" rx="24"/>
  ${blobs.join('\n  ')}
  <rect width="600" height="600" fill="url(#halo)"/>

  <circle cx="300" cy="240" r="120" fill="white" opacity="0.55"/>
  <circle cx="300" cy="240" r="118" fill="none" stroke="${theme.accent}" stroke-opacity="0.35" stroke-width="3"/>

  <text x="300" y="290" text-anchor="middle"
        font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif"
        font-size="160">${escXml(glyph)}</text>

  ${lineNodes}

  <rect x="220" y="540" width="160" height="40" rx="20"
        fill="${theme.accent}" opacity="0.95"/>
  <text x="300" y="567" text-anchor="middle"
        font-family="Inter, system-ui, sans-serif"
        font-size="22" font-weight="700" fill="white">৳99</text>
</svg>
`;
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const map = {};
  let count = 0;

  for (const cat of CATEGORIES) {
    cat.products.forEach((productName, idx) => {
      const slug = `${cat.slug}-${slugify(productName)}`;
      const file = `${slug}.svg`;
      const svg = buildSvg({
        categorySlug: cat.slug,
        categoryName: cat.name,
        categoryIcon: cat.icon,
        productName,
        index: idx + cat.slug.length * 7,
      });
      fs.writeFileSync(path.join(OUT_DIR, file), svg, 'utf8');
      map[`${cat.slug}|${productName}`] = `/uploads/products/${file}`;
      count += 1;
    });
  }

  // Print the lookup map so seed.js / a follow-up script can import it.
  console.log(`Wrote ${count} SVG cards to ${OUT_DIR}`);
  fs.writeFileSync(
    path.join(__dirname, 'image-map.json'),
    JSON.stringify(map, null, 2),
    'utf8'
  );
  console.log(`Lookup map -> ${path.join(__dirname, 'image-map.json')}`);
}

main();