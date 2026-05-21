import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const shop = await prisma.shop.create({
    data: {
      name: 'Test Print Shop',
      location: 'Mumbai, Maharashtra',
      contact: '9876543210',
      settings: { operatingHours: { open: '09:00', close: '21:00', days: ['Mon','Tue','Wed','Thu','Fri','Sat'] }, queueCapacity: 50, autoAcceptOrders: true },
    },
  });

  await prisma.pricingRule.createMany({
    data: [
      { shopId: shop.id, colorMode: 'bw', sides: 'single', pricePerPage: 2 },
      { shopId: shop.id, colorMode: 'bw', sides: 'duplex', pricePerPage: 3 },
      { shopId: shop.id, colorMode: 'color', sides: 'single', pricePerPage: 10 },
      { shopId: shop.id, colorMode: 'color', sides: 'duplex', pricePerPage: 20 },
    ],
  });

  const adminPassword = await bcrypt.hash('Admin@123', 12);
  await prisma.user.create({
    data: {
      name: 'Shop Admin',
      email: 'admin@testshop.com',
      passwordHash: adminPassword,
      role: 'OPERATOR',
      shopId: shop.id,
    },
  });

  console.log('Seed complete. Shop ID:', shop.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
