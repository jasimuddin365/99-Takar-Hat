// Smoke-test the three fixes from this session.
//   1. Admin POST /api/admin/categories  (was 400 Validation failed)
//   2. Vendor POST /api/products         (was 500 Argument 'since' is missing)
//   3. Customer POST /api/orders         (was 500 Argument 'product' is missing)
// Each test logs in, hits the endpoint, prints the response status + body.

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

async function login(email, password) {
  const r = await req('POST', '/api/auth/login', { body: { email, password } });
  if (r.status !== 200) throw new Error(`login ${email} failed: ${r.status} ${JSON.stringify(r.body)}`);
  return r.body.token;
}

async function getCookieJar(token) {
  // We don't have a real cookie jar; this test suite uses the token via header.
  return token;
}

(async () => {
  console.log('=== 1. Admin create category ===');
  const adminTok = await login('admin@gmail.com', '123456');
  // Use a unique slug each run so we don't hit the unique constraint.
  const slug = 'smoke-' + Date.now();
  const cat = await req('POST', '/api/admin/categories', {
    token: adminTok,
    body: { name: 'SmokeHeadPhone', icon: '🎧', slug, position: '7' },
  });
  console.log('status:', cat.status);
  console.log('body:', JSON.stringify(cat.body));
  const cleanup = await req('DELETE', `/api/admin/categories/${cat.body.category.id}`, { token: adminTok });
  console.log('cleanup delete status:', cleanup.status);

  console.log('\n=== 2. Vendor create product ===');
  const vendorTok = await login('vendor@gmail.com', 'demo123');
  // First wipe vendor's stall so we hit the ensureStallForUser lazy-create path.
  // Actually skip — there's already a stall from earlier seed. We just create a product.
  // But to reproduce the original 500 path, we need a vendor with NO stall yet.
  // Use a fresh signup flow instead:
  const newVendorEmail = `v_${Date.now()}@gmail.com`;
  const newV = await req('POST', '/api/auth/register', {
    body: { name: 'TestVendor', email: newVendorEmail, password: 'demo123', role: 'VENDOR' },
  });
  console.log('register new vendor:', newV.status, newV.body.user && newV.body.user.role);
  const newVTok = newV.body.token;
  // Pick any active category.
  const cats = await req('GET', '/api/categories');
  const catSlug = cats.body.categories[0].slug;
  const prod = await req('POST', '/api/products', {
    token: newVTok,
    body: {
      name: 'SmokeTestProduct',
      description: 'created via smoke test',
      categorySlug: catSlug,
      stock: 5,
      discount: 10,
      price: 99,
    },
  });
  console.log('create product status:', prod.status);
  console.log('body:', JSON.stringify(prod.body).slice(0, 400));

  console.log('\n=== 3. Customer place order ===');
  const custTok = await login('customer@gmail.com', 'demo123');
  // Clear cart first
  const cart0 = await req('GET', '/api/cart', { token: custTok });
  for (const ci of (cart0.body.cart || cart0.body.items || [])) {
    await req('DELETE', `/api/cart/${ci.id}`, { token: custTok });
  }
  // Add one product
  const prods = await req('GET', '/api/products?limit=1');
  const pid = prods.body.products[0].id;
  const add = await req('POST', '/api/cart', { token: custTok, body: { productId: pid, qty: 1 } });
  console.log('add to cart:', add.status, add.body.item && add.body.item.id);
  const order = await req('POST', '/api/orders', {
    token: custTok,
    body: {
      address: 'House 12, Road 5, Banani',
      phone: '01712345678',
      notes: 'smoke test',
      paymentMethod: 'COD',
    },
  });
  console.log('place order status:', order.status);
  console.log('body:', JSON.stringify(order.body).slice(0, 600));

  console.log('\nDONE');
})().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
