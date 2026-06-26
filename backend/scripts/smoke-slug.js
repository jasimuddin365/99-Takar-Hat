// Smoke test: POST /api/admin/categories with the exact payload the new
// AdminCategoriesPage.jsx will send for "Pet Supplies".
const http = require('http');

function req(method, path, { body, token } = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
          ...(token ? { Cookie: `taka_token=${token}` } : {}),
        },
      },
      (res) => {
        let chunks = '';
        res.on('data', (c) => (chunks += c));
        res.on('end', () => {
          let parsed = null;
          try { parsed = JSON.parse(chunks); } catch (_) { parsed = chunks; }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

(async () => {
  const lg = await req('POST', '/api/auth/login', { body: { email: 'admin@gmail.com', password: '123456' } });
  const token = lg.body.token;
  console.log('login status:', lg.status);

  // Simulate exactly what the new frontend posts for "Pet Supplies"
  const created = await req('POST', '/api/admin/categories', {
    token,
    body: { slug: 'pet-supplies', name: 'Pet Supplies', icon: '🛒', position: 10, isActive: true },
  });
  console.log('POST status:', created.status);
  console.log('body:', JSON.stringify(created.body));

  // Cleanup
  if (created.body && created.body.category && created.body.category.id) {
    const del = await req('DELETE', `/api/admin/categories/${created.body.category.id}`, { token });
    console.log('cleanup status:', del.status);
  }

  // Try a name that slugifies to a duplicate (food) — expect 409
  const dup = await req('POST', '/api/admin/categories', {
    token,
    body: { slug: 'food', name: 'Food Duplicate', icon: '🍱', position: 99, isActive: true },
  });
  console.log('duplicate-slug status (expected 409):', dup.status);
  console.log('duplicate body:', JSON.stringify(dup.body));
})().catch((e) => { console.error('FATAL', e); process.exit(1); });