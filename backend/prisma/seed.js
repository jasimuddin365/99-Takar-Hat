// Prisma seeder — run via `npx prisma db seed` or `npm run prisma:seed`.
// Creates 3 demo users, 15 categories, 5 vendor stalls, 100+ products,
// and a couple of sample reviews so the customer/vendor/admin flows have data
// the moment the app boots.

const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { CATEGORIES, VENDORS, getDescription, DEMO_USERS } = require('./seed-data');

// Per-product imageUrl map written by generate-product-images.js.
// Falls back to /uploads/placeholder.svg if the script hasn't been run yet.
const IMAGE_MAP_PATH = path.join(__dirname, 'scripts', 'image-map.json');
let imageMap = {};
try {
  imageMap = JSON.parse(fs.readFileSync(IMAGE_MAP_PATH, 'utf8'));
} catch (_) {
  console.warn('  ⚠ image-map.json missing — run scripts/generate-product-images.js first');
}
const DEFAULT_IMAGE = '/uploads/placeholder.svg';
const imageFor = (catSlug, name) => imageMap[`${catSlug}|${name}`] || DEFAULT_IMAGE;

const prisma = new PrismaClient();

// Deterministic PRNG so reseeding yields stable numbers.
function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

async function main() {
  console.log('🌱 Seeding 99 Taka Bazaar database…');

  // 1. Wipe in dependency order
  console.log('  • clearing existing data');
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.stall.deleteMany();
  await prisma.user.deleteMany();

  // 2. Demo users (passwords hashed with bcrypt)
  console.log('  • demo users');
  const usersByEmail = {};
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
  for (const u of DEMO_USERS) {
    const passwordHash = await bcrypt.hash(u.password, saltRounds);
    const user = await prisma.user.create({
      data: {
        email: u.email,
        passwordHash,
        name: u.name,
        avatar: u.avatar,
        role: u.role,
        phone: u.phone,
        city: u.city,
        address: u.address,
      },
    });
    usersByEmail[u.email] = user;
  }

  // 3. Stalls (vendor profile for VENDOR users)
  console.log('  • stalls');
  const stallsBySlug = {};
  for (const v of VENDORS) {
    const ownerEmail = Object.keys(usersByEmail).find((e) => {
      const du = DEMO_USERS.find((x) => x.email === e);
      return du && du.role === 'VENDOR' && du.stallSlug === v.slug;
    });

    const stall = await prisma.stall.create({
      data: {
        slug: v.slug,
        name: v.name,
        emoji: v.emoji,
        ownerName: v.ownerName,
        location: v.location,
        rating: v.rating,
        totalSales: v.totalSales,
        since: v.since,
        description:
          'Your go-to store for quality everyday items at ৳99. Fast delivery, trusted by thousands.',
        ...(ownerEmail ? { ownerId: usersByEmail[ownerEmail].id } : {}),
      },
    });
    stallsBySlug[v.slug] = stall;
  }

  // For each vendor, ensure a user owns the stall (so vendor pages work).
  // Vendors that aren't the demo owner get auto-created accounts.
  console.log('  • vendor owners for non-demo stalls');
  for (const v of VENDORS) {
    const stall = stallsBySlug[v.slug];
    if (!stall.ownerId) {
      const email = `${v.slug}@vendor.com`;
      const passwordHash = await bcrypt.hash('demo123', saltRounds); // initial password; vendor resets on first login
      const owner = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: v.ownerName,
          avatar: v.name.charAt(0),
          role: 'VENDOR',
        },
      });
      await prisma.stall.update({ where: { id: stall.id }, data: { ownerId: owner.id } });
    }
  }

  // 4. Categories
  console.log('  • categories');
  const categoriesBySlug = {};
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i];
    const cat = await prisma.category.create({
      data: { slug: c.slug, name: c.name, icon: c.icon, position: i },
    });
    categoriesBySlug[c.slug] = cat;
  }

  // 5. Products — every (category, product-name) pair, round-robin assigned to a vendor.
  console.log('  • products');
  const badgePool = ['new', 'hot', 'sale', null];
  const vendorStalls = Object.values(stallsBySlug);
  let productCounter = 0;
  let createdCount = 0;

  for (const cat of CATEGORIES) {
    for (const productName of cat.products) {
      const stall = vendorStalls[productCounter % vendorStalls.length];
      const rand = seededRandom(productCounter * 9301 + 49297);

      const stock = Math.floor(rand() * 80) + 10;        // 10..89
      const sales = Math.floor(rand() * 300) + 20;       // 20..319
      const rating = parseFloat((4.2 + rand() * 0.7).toFixed(1));
      const badge = badgePool[productCounter % badgePool.length];

      await prisma.product.create({
        data: {
          name: productName,
          description: getDescription(productName, cat.name),
          price: 99,
          stock,
          sales,
          rating,
          badge,
          discount: 0,
          imageUrl: imageFor(cat.slug, productName),
          stallId: stall.id,
          categoryId: categoriesBySlug[cat.slug].id,
        },
      });
      createdCount += 1;
      productCounter += 1;
    }
  }

  // 6. Sample reviews on first products (matches reference HTML)
  console.log('  • sample reviews');
  const customer =
    usersByEmail['customer@gmail.com'] || usersByEmail['customer@demo.com'];
  const allProducts = await prisma.product.findMany({ orderBy: { createdAt: 'asc' } });
  if (allProducts[0]) {
    await prisma.review.create({
      data: {
        userId: customer.id,
        productId: allProducts[0].id,
        stars: 5,
        text: 'Excellent product! Fast delivery.',
      },
    });
    await prisma.review.create({
      data: {
        userId: customer.id,
        productId: allProducts[1]?.id || allProducts[0].id,
        stars: 4,
        text: 'Good quality for the price.',
      },
    });
  }
  if (allProducts[5]) {
    await prisma.review.create({
      data: {
        userId: customer.id,
        productId: allProducts[5].id,
        stars: 5,
        text: 'Love it!',
      },
    });
  }

  console.log(
    `✅ Seed complete — ${createdCount} products across ${CATEGORIES.length} categories, ` +
      `${VENDORS.length} vendors, ${DEMO_USERS.length} demo users.`
  );
  console.log('   Admin: admin@gmail.com / 123456');
  console.log('   Vendor: vendor@gmail.com / demo123');
  console.log('   Customer: customer@gmail.com / demo123');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });