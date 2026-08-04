import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Clean existing seed data optionally or upsert
  await prisma.printOrder.deleteMany({});
  await prisma.printer.deleteMany({});
  await prisma.pricingRule.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.shop.deleteMany({});

  const adminPassword = await bcrypt.hash('Admin@123', 12);

  // Shop 1: PrintHub Express (Shivajinagar)
  const shop1 = await prisma.shop.create({
    data: {
      name: 'PrintHub Express',
      location: 'Shivajinagar, Pune',
      address: 'Opposite COEP Technological University, Shivajinagar',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411005',
      latitude: 18.5293,
      longitude: 73.8565,
      phone: '+91 98230 11223',
      isOpen: true,
      openingHours: '08:00 AM',
      closingHours: '10:00 PM',
      rating: 4.8,
      contact: 'contact@printhub.com',
      settings: { operatingHours: { open: '08:00', close: '22:00', days: ['Mon','Tue','Wed','Thu','Fri','Sat'] }, queueCapacity: 50, autoAcceptOrders: true },
    },
  });

  // Shop 2: College Xerox & Stationers (Kothrud)
  const shop2 = await prisma.shop.create({
    data: {
      name: 'College Xerox & Stationers',
      location: 'Kothrud, Pune',
      address: 'Near MIT Campus, Paud Road, Kothrud',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411038',
      latitude: 18.5074,
      longitude: 73.8077,
      phone: '+91 98230 99887',
      isOpen: true,
      openingHours: '09:00 AM',
      closingHours: '09:00 PM',
      rating: 4.6,
      contact: 'kothrudxerox@gmail.com',
      settings: { operatingHours: { open: '09:00', close: '21:00', days: ['Mon','Tue','Wed','Thu','Fri','Sat'] }, queueCapacity: 40, autoAcceptOrders: true },
    },
  });

  // Shop 3: Pune University Digital Print
  const shop3 = await prisma.shop.create({
    data: {
      name: 'Pune University Digital Print',
      location: 'University Road, Pune',
      address: 'Ganeshkhind Road, Next to Main Gate, SPPU Campus',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411007',
      latitude: 18.5529,
      longitude: 73.8248,
      phone: '+91 98230 55443',
      isOpen: true,
      openingHours: '08:30 AM',
      closingHours: '08:30 PM',
      rating: 4.9,
      contact: 'uniprint@sppu.ac.in',
      settings: { operatingHours: { open: '08:30', close: '20:30', days: ['Mon','Tue','Wed','Thu','Fri'] }, queueCapacity: 60, autoAcceptOrders: true },
    },
  });

  // Shop 4: FC Road Quick Print
  const shop4 = await prisma.shop.create({
    data: {
      name: 'FC Road Quick Print',
      location: 'Deccan Gymkhana, Pune',
      address: 'Fergusson College Road, Opposite Goodluck Cafe',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411004',
      latitude: 18.5196,
      longitude: 73.8415,
      phone: '+91 98230 77665',
      isOpen: false,
      openingHours: '09:00 AM',
      closingHours: '08:00 PM',
      rating: 4.4,
      contact: 'fcprint@gmail.com',
      settings: { operatingHours: { open: '09:00', close: '20:00', days: ['Mon','Tue','Wed','Thu','Fri','Sat'] }, queueCapacity: 30, autoAcceptOrders: true },
    },
  });

  // Pricing rules for all shops
  const shops = [shop1, shop2, shop3, shop4];
  for (const s of shops) {
    await prisma.pricingRule.createMany({
      data: [
        { shopId: s.id, colorMode: 'bw', sides: 'single', pricePerPage: 2 },
        { shopId: s.id, colorMode: 'bw', sides: 'duplex', pricePerPage: 3 },
        { shopId: s.id, colorMode: 'color', sides: 'single', pricePerPage: 10 },
        { shopId: s.id, colorMode: 'color', sides: 'duplex', pricePerPage: 18 },
      ],
    });

    await prisma.printer.createMany({
      data: [
        { shopId: s.id, name: 'Canon ImageRUNNER 2630', supportsColor: false, supportsDuplex: true, isOnline: true },
        { shopId: s.id, name: 'Epson WorkForce Pro C869R', supportsColor: true, supportsDuplex: true, isOnline: true },
      ],
    });
  }

  // Create operator users for shop1
  await prisma.user.create({
    data: {
      name: 'PrintHub Manager',
      email: 'admin@printhub.com',
      passwordHash: adminPassword,
      role: 'OPERATOR',
      shopId: shop1.id,
    },
  });

  // Create a default customer user
  const customerPassword = await bcrypt.hash('Customer@123', 12);
  await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash: customerPassword,
      role: 'CUSTOMER',
    },
  });

  console.log('Seed complete. Shops created:', shops.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
