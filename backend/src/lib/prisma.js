// Single shared PrismaClient — avoids exhausting DB connections on hot reload.
// Used by route modules and the seeder.

const { PrismaClient } = require('@prisma/client');

const prisma = global.__prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

module.exports = prisma;
