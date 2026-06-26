// Quick probe: how long do cart / wishlist / orders queries actually take?
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const u = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } });
  console.log('user', u && u.id, u && u.email);

  let sw = Date.now();
  const items = await prisma.cartItem.findMany({
    where: { userId: u.id },
    include: { product: true },
  });
  console.log('cart items in', Date.now() - sw, 'ms →', items.length);

  sw = Date.now();
  const items2 = await prisma.wishlistItem.findMany({
    where: { userId: u.id },
    include: { product: { include: { category: true, stall: true } } },
  });
  console.log('wishlist items in', Date.now() - sw, 'ms →', items2.length);

  sw = Date.now();
  const items3 = await prisma.order.findMany({
    where: { userId: u.id },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              imageUrl: true,
              category: { select: { id: true, slug: true, name: true, icon: true } },
              stall: { select: { id: true, slug: true, name: true, emoji: true, location: true } },
            },
          },
        },
      },
      user: { select: { id: true, name: true, phone: true, city: true } },
    },
  });
  console.log('orders in', Date.now() - sw, 'ms →', items3.length);

  await prisma.$disconnect();
})();
