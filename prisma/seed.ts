import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Service templates for pre-population
const serviceTemplates = {
  cleaning: [
    {
      title: 'House Cleaning (1 Bedroom)',
      description:
        'Standard cleaning for a 1-bedroom home including all rooms, kitchen, and bathroom.',
      minPrice: 30000,
      maxPrice: 50000,
    },
    {
      title: 'House Cleaning (2 Bedrooms)',
      description:
        'Standard cleaning for a 2-bedroom home including all rooms, kitchen, and bathrooms.',
      minPrice: 50000,
      maxPrice: 80000,
    },
    {
      title: 'House Cleaning (3 Bedrooms)',
      description:
        'Standard cleaning for a 3-bedroom home including all rooms, kitchen, and bathrooms.',
      minPrice: 80000,
      maxPrice: 120000,
    },
    {
      title: 'Deep Cleaning',
      description:
        'Thorough deep cleaning including appliances, cabinets, and hard-to-reach areas.',
      minPrice: 100000,
      maxPrice: 200000,
    },
    {
      title: 'Office Cleaning',
      description:
        'Professional office space cleaning for small to medium offices.',
      minPrice: 50000,
      maxPrice: 150000,
    },
  ],
  handyman: [
    {
      title: 'Minor Repairs',
      description:
        'Fix small issues like loose handles, wall holes, and general maintenance.',
      minPrice: 20000,
      maxPrice: 50000,
    },
    {
      title: 'Furniture Assembly',
      description:
        'Assembly of flat-pack furniture from IKEA, Nambah, and other stores.',
      minPrice: 30000,
      maxPrice: 100000,
    },
    {
      title: 'Painting (Per Room)',
      description: 'Interior room painting including prep work and cleanup.',
      minPrice: 80000,
      maxPrice: 150000,
    },
    {
      title: 'TV Mounting',
      description: 'Professional TV wall mounting with cable management.',
      minPrice: 30000,
      maxPrice: 80000,
    },
    {
      title: 'Door & Lock Repair',
      description: 'Fix or replace door locks, handles, and hinges.',
      minPrice: 25000,
      maxPrice: 75000,
    },
  ],
  plumbing: [
    {
      title: 'Pipe Repair',
      description: 'Fix leaking or damaged pipes in your home.',
      minPrice: 25000,
      maxPrice: 70000,
    },
    {
      title: 'Drain Unclogging',
      description: 'Clear blocked drains in sinks, showers, or toilets.',
      minPrice: 30000,
      maxPrice: 80000,
    },
    {
      title: 'Tap/Faucet Replacement',
      description: 'Install or replace taps and faucets.',
      minPrice: 20000,
      maxPrice: 60000,
    },
    {
      title: 'Toilet Repair',
      description: 'Fix running toilets, leaks, or replace parts.',
      minPrice: 25000,
      maxPrice: 70000,
    },
    {
      title: 'Water Heater Service',
      description: 'Installation, repair, or maintenance of water heaters.',
      minPrice: 50000,
      maxPrice: 150000,
    },
  ],
};

async function main() {
  console.log('Start seeding...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@chazon.com' },
    update: {},
    create: {
      id: 'admin-user-id',
      email: 'admin@chazon.com',
      name: 'Chazon Admin',
      password: hashedPassword,
      role: 'ADMIN',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
    },
  });
  console.log('Created admin:', admin.email);

  // Create Clients
  const client1 = await prisma.user.upsert({
    where: { email: 'alice@chazon.com' },
    update: {},
    create: {
      id: 'client-alice-id',
      email: 'alice@chazon.com',
      name: 'Alice Client',
      password: hashedPassword,
      role: 'CLIENT',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    },
  });

  const client2 = await prisma.user.upsert({
    where: { email: 'bob@chazon.com' },
    update: {},
    create: {
      id: 'client-bob-id',
      email: 'bob@chazon.com',
      name: 'Bob Client',
      password: hashedPassword,
      role: 'CLIENT',
    },
  });
  console.log('Created clients:', client1.email, client2.email);

  // Create Cleaning Steward
  const cleanerProfile = await prisma.stewardProfile.findUnique({
    where: { userId: 'steward-cleaner-id' },
  });

  if (!cleanerProfile) {
    const cleaner = await prisma.user.upsert({
      where: { email: 'cleaner@chazon.com' },
      update: {},
      create: {
        id: 'steward-cleaner-id',
        email: 'cleaner@chazon.com',
        name: 'Sarah Cleaner',
        password: hashedPassword,
        role: 'STEWARD',
        image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956',
        stewardProfile: {
          create: {
            bio: 'Professional cleaner with 5+ years of experience. Specializing in deep cleaning and regular home maintenance.',
            rating: 4.8,
            completedTasks: 150,
            backgroundCheckStatus: 'CLEARED',
            status: 'APPROVED',
            latitude: 0.3476,
            longitude: 32.5825,
            serviceRadius: 15,
            services: {
              create: serviceTemplates.cleaning.map((s, i) => ({
                title: s.title,
                description: s.description,
                category: 'Cleaning',
                price: s.minPrice + Math.floor((s.maxPrice - s.minPrice) / 2),
                pricingType: 'FLAT',
                duration: 60 + i * 30,
              })),
            },
            availability: {
              create: [
                { dayOfWeek: 1, startTime: '08:00', endTime: '18:00' },
                { dayOfWeek: 2, startTime: '08:00', endTime: '18:00' },
                { dayOfWeek: 3, startTime: '08:00', endTime: '18:00' },
                { dayOfWeek: 4, startTime: '08:00', endTime: '18:00' },
                { dayOfWeek: 5, startTime: '08:00', endTime: '18:00' },
                { dayOfWeek: 6, startTime: '09:00', endTime: '14:00' },
              ],
            },
          },
        },
      },
    });
    console.log('Created cleaning steward:', cleaner.email);
  }

  // Create Handyman Steward
  const handymanProfile = await prisma.stewardProfile.findUnique({
    where: { userId: 'steward-handyman-id' },
  });

  if (!handymanProfile) {
    const handyman = await prisma.user.upsert({
      where: { email: 'handyman@chazon.com' },
      update: {},
      create: {
        id: 'steward-handyman-id',
        email: 'handyman@chazon.com',
        name: 'John Handyman',
        password: hashedPassword,
        role: 'STEWARD',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        stewardProfile: {
          create: {
            bio: 'Skilled handyman for all your home repair needs. From minor fixes to furniture assembly.',
            rating: 4.7,
            completedTasks: 95,
            backgroundCheckStatus: 'CLEARED',
            status: 'APPROVED',
            latitude: 0.3136,
            longitude: 32.5811,
            serviceRadius: 20,
            services: {
              create: serviceTemplates.handyman.map((s, i) => ({
                title: s.title,
                description: s.description,
                category: 'Handyman',
                price: s.minPrice + Math.floor((s.maxPrice - s.minPrice) / 2),
                pricingType: 'FLAT',
                duration: 60 + i * 30,
              })),
            },
            availability: {
              create: [
                { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
                { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
                { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
                { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
                { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
              ],
            },
          },
        },
      },
    });
    console.log('Created handyman steward:', handyman.email);
  }

  // Create Plumbing Steward
  const plumberProfile = await prisma.stewardProfile.findUnique({
    where: { userId: 'steward-plumber-id' },
  });

  if (!plumberProfile) {
    const plumber = await prisma.user.upsert({
      where: { email: 'plumber@chazon.com' },
      update: {},
      create: {
        id: 'steward-plumber-id',
        email: 'plumber@chazon.com',
        name: 'Michael Plumber',
        password: hashedPassword,
        role: 'STEWARD',
        image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a',
        stewardProfile: {
          create: {
            bio: 'Licensed plumber with 8+ years of experience. Available for emergencies and scheduled repairs.',
            rating: 4.9,
            completedTasks: 200,
            backgroundCheckStatus: 'CLEARED',
            status: 'APPROVED',
            latitude: 0.3324,
            longitude: 32.5825,
            serviceRadius: 25,
            services: {
              create: serviceTemplates.plumbing.map((s, i) => ({
                title: s.title,
                description: s.description,
                category: 'Plumbing',
                price: s.minPrice + Math.floor((s.maxPrice - s.minPrice) / 2),
                pricingType: 'FLAT',
                duration: 60 + i * 30,
              })),
            },
            availability: {
              create: [
                { dayOfWeek: 1, startTime: '08:00', endTime: '18:00' },
                { dayOfWeek: 2, startTime: '08:00', endTime: '18:00' },
                { dayOfWeek: 3, startTime: '08:00', endTime: '18:00' },
                { dayOfWeek: 4, startTime: '08:00', endTime: '18:00' },
                { dayOfWeek: 5, startTime: '08:00', endTime: '18:00' },
                { dayOfWeek: 6, startTime: '09:00', endTime: '15:00' },
              ],
            },
          },
        },
      },
    });
    console.log('Created plumbing steward:', plumber.email);
  }

  // Create System Config
  await prisma.systemConfig.upsert({
    where: { id: 'main-config' },
    update: {},
    create: {
      id: 'main-config',
      bookingsEnabled: true,
      escrowAutoReleaseEnabled: true,
      stewardAcceptEnabled: true,
    },
  });
  console.log('Created system config');

  console.log('Seeding completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
