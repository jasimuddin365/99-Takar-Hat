// One-off: remove the 3 demo accounts (cascade-deletes their cart/wishlist/reviews).
// Order items + orders authored by customer@demo.com will also be removed via FK cascade.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEMO_EMAILS = ['customer@demo.com', 'vendor@demo.com', 'admin@demo.com'];

async function main() {
  for (const email of DEMO_EMAILS) {
    const u = await prisma.user.findUnique({ where: { email }, include: { stall: true } });
    if (!u) {
      console.log(`• ${email} — not found, skipping`);
      continue;
    }
    // Detach stall so deleting the user doesn't fail (stall has ownerId FK to user).
    if (u.stall) {
      await prisma.stall.update({ where: { id: u.stall.id }, data: { ownerId: null } });
    }
    // Delete orders + items + reviews + cart + wishlist explicitly to avoid FK issues.
    await prisma.review.deleteMany({ where: { userId: u.id } });
    await prisma.cartItem.deleteMany({ where: { userId: u.id } });
    await prisma.wishlistItem.deleteMany({ where: { userId: u.id } });
    await prisma.orderItem.deleteMany({ where: { order: { userId: u.id } } });
    await prisma.order.deleteMany({ where: { userId: u.id } });
    await prisma.user.delete({ where: { id: u.id } });
    console.log(`✓ deleted ${email} (${u.id}, ${u.role})`);
  }
}

main()
  .catch((e) => {
    console.error('delete failed:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());