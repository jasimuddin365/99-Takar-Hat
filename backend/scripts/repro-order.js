// Reproduce the remaining 500 on POST /api/orders, dump the FULL error.
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
  return r.body.token;
}

(async () => {
  const custTok = await login('customer@gmail.com', 'demo123');
  const cart0 = await req('GET', '/api/cart', { token: custTok });
  const items = cart0.body.cart || cart0.body.items || [];
  for (const ci of items) {
    await req('DELETE', `/api/cart/${ci.id}`, { token: custTok });
  }
  const prods = await req('GET', '/api/products?limit=1');
  const pid = prods.body.products[0].id;
  await req('POST', '/api/cart', { token: custTok, body: { productId: pid, qty: 1 } });
  const order = await req('POST', '/api/orders', {
    token: custTok,
    body: {
      address: 'House 12, Road 5, Banani',
      phone: '01712345678',
      notes: 'smoke test',
      paymentMethod: 'COD',
    },
  });
  console.log('status:', order.status);
  console.log('FULL BODY:');
  console.log(JSON.stringify(order.body, null, 2));
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
