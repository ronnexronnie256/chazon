import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Realistic service images from Unsplash
const serviceImages = {
  cleaning: [
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&q=80',
    'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=800&q=80',
  ],
  handyman: [
    'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=800&q=80',
    'https://images.unsplash.com/photo-1597306536810-95efc0d6c4be?w=800&q=80',
    'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80',
    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80',
  ],
  plumbing: [
    'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&q=80',
    'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80',
    'https://images.unsplash.com/photo-1504851149312-7a075b496cc7?w=800&q=80',
  ],
};

// Steward avatar images
const stewardAvatars = {
  ronald:
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
  david:
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
  moses:
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
  grace:
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
  joseph:
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80',
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
      image:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
    },
  });
  console.log('Created admin:', admin.email);

  // Create Clients
  await prisma.user.upsert({
    where: { email: 'alice@chazon.com' },
    update: {},
    create: {
      id: 'client-alice-id',
      email: 'alice@chazon.com',
      name: 'Alice Namuli',
      password: hashedPassword,
      role: 'CLIENT',
      image:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    },
  });

  await prisma.user.upsert({
    where: { email: 'bob@chazon.com' },
    update: {},
    create: {
      id: 'client-bob-id',
      email: 'bob@chazon.com',
      name: 'Robert Ssekitoleko',
      password: hashedPassword,
      role: 'CLIENT',
    },
  });
  console.log('Created clients');

  // ========== STEWARD 1: Ronald Ssemakula (Cleaning) ==========
  const ronaldProfile = await prisma.stewardProfile.findUnique({
    where: { userId: 'steward-ronald-id' },
  });

  if (!ronaldProfile) {
    await prisma.user.upsert({
      where: { email: 'ronald@chazon.com' },
      update: {},
      create: {
        id: 'steward-ronald-id',
        email: 'ronald@chazon.com',
        name: 'Ronald Ssemakula',
        password: hashedPassword,
        role: 'STEWARD',
        image: stewardAvatars.ronald,
        stewardProfile: {
          create: {
            bio: 'Professional cleaner with 8 years of experience. Specializing in deep cleaning, post-construction cleaning, and office maintenance. Certified by the Uganda Cleaning Association.',
            rating: 4.9,
            completedTasks: 47,
            backgroundCheckStatus: 'CLEARED',
            status: 'APPROVED',
            latitude: 0.3476,
            longitude: 32.5825,
            serviceRadius: 20,
            services: {
              create: [
                {
                  title: 'Deep House Cleaning',
                  description:
                    'Complete interior cleaning including all rooms, kitchen appliances, bathrooms, and hard-to-reach areas. Includes window cleaning and floor mopping.',
                  category: 'Cleaning',
                  price: 85000,
                  pricingType: 'FLAT',
                  duration: 240,
                  images: [
                    serviceImages.cleaning[0],
                    serviceImages.cleaning[1],
                  ],
                },
                {
                  title: 'Post-Construction Cleaning',
                  description:
                    'Thorough cleaning after renovation or construction. Removes dust, debris, and paint spots. Includes inside cabinets and all surfaces.',
                  category: 'Cleaning',
                  price: 150000,
                  pricingType: 'FLAT',
                  duration: 360,
                  images: [serviceImages.cleaning[2]],
                },
                {
                  title: 'Office Cleaning (Weekly)',
                  description:
                    'Regular office cleaning service. Includes desk wiping, floor vacuuming, kitchen/bathroom cleaning, and trash disposal.',
                  category: 'Cleaning',
                  price: 200000,
                  pricingType: 'FLAT',
                  duration: 180,
                  images: [serviceImages.cleaning[3]],
                },
                {
                  title: 'Carpet & Upholstery Cleaning',
                  description:
                    'Deep cleaning for carpets, rugs, and furniture upholstery. Uses professional-grade equipment and eco-friendly solutions.',
                  category: 'Cleaning',
                  price: 65000,
                  pricingType: 'FLAT',
                  duration: 120,
                  images: [serviceImages.cleaning[0]],
                },
              ],
            },
            availability: {
              create: [
                { dayOfWeek: 1, startTime: '07:00', endTime: '18:00' },
                { dayOfWeek: 2, startTime: '07:00', endTime: '18:00' },
                { dayOfWeek: 3, startTime: '07:00', endTime: '18:00' },
                { dayOfWeek: 4, startTime: '07:00', endTime: '18:00' },
                { dayOfWeek: 5, startTime: '07:00', endTime: '18:00' },
                { dayOfWeek: 6, startTime: '08:00', endTime: '14:00' },
              ],
            },
          },
        },
      },
    });
    console.log('Created steward: Ronald Ssemakula (Cleaning)');
  }

  // ========== STEWARD 2: David Ochieng (Handyman) ==========
  const davidProfile = await prisma.stewardProfile.findUnique({
    where: { userId: 'steward-david-id' },
  });

  if (!davidProfile) {
    await prisma.user.upsert({
      where: { email: 'david@chazon.com' },
      update: {},
      create: {
        id: 'steward-david-id',
        email: 'david@chazon.com',
        name: 'David Ochieng',
        password: hashedPassword,
        role: 'STEWARD',
        image: stewardAvatars.david,
        stewardProfile: {
          create: {
            bio: 'Skilled handyman with expertise in furniture assembly, TV mounting, and general home repairs. Works with all major furniture brands. Fast and reliable.',
            rating: 4.8,
            completedTasks: 32,
            backgroundCheckStatus: 'CLEARED',
            status: 'APPROVED',
            latitude: 0.3136,
            longitude: 32.5811,
            serviceRadius: 25,
            services: {
              create: [
                {
                  title: 'Furniture Assembly',
                  description:
                    'Professional assembly of all flat-pack furniture including IKEA, Nambah, and other brands. Includes disposal of packaging materials.',
                  category: 'Handyman',
                  price: 45000,
                  pricingType: 'FLAT',
                  duration: 120,
                  images: [serviceImages.handyman[0]],
                },
                {
                  title: 'TV Mounting',
                  description:
                    'Secure wall mounting for TVs up to 65 inches. Includes cable management and TV setup. All mounting hardware included.',
                  category: 'Handyman',
                  price: 35000,
                  pricingType: 'FLAT',
                  duration: 60,
                  images: [serviceImages.handyman[3]],
                },
                {
                  title: 'Door & Lock Repair',
                  description:
                    'Fix squeaky doors, replace locks, install deadbolts, and repair door frames. Keys provided for new lock installations.',
                  category: 'Handyman',
                  price: 40000,
                  pricingType: 'FLAT',
                  duration: 90,
                  images: [serviceImages.handyman[2]],
                },
                {
                  title: 'General Repairs',
                  description:
                    'Fix loose handles, wall holes, picture hanging, and other minor household repairs. Materials not included.',
                  category: 'Handyman',
                  price: 30000,
                  pricingType: 'HOURLY',
                  duration: 60,
                  images: [serviceImages.handyman[1]],
                },
                {
                  title: 'Picture Hanging & Mounting',
                  description:
                    'Professional hanging of frames, mirrors, shelves, and wall art. Includes all mounting hardware.',
                  category: 'Handyman',
                  price: 25000,
                  pricingType: 'FLAT',
                  duration: 45,
                  images: [serviceImages.handyman[2]],
                },
              ],
            },
            availability: {
              create: [
                { dayOfWeek: 1, startTime: '08:00', endTime: '18:00' },
                { dayOfWeek: 2, startTime: '08:00', endTime: '18:00' },
                { dayOfWeek: 3, startTime: '08:00', endTime: '18:00' },
                { dayOfWeek: 4, startTime: '08:00', endTime: '18:00' },
                { dayOfWeek: 5, startTime: '08:00', endTime: '18:00' },
              ],
            },
          },
        },
      },
    });
    console.log('Created steward: David Ochieng (Handyman)');
  }

  // ========== STEWARD 3: Moses Tumusiime (Plumbing) ==========
  const mosesProfile = await prisma.stewardProfile.findUnique({
    where: { userId: 'steward-moses-id' },
  });

  if (!mosesProfile) {
    await prisma.user.upsert({
      where: { email: 'moses@chazon.com' },
      update: {},
      create: {
        id: 'steward-moses-id',
        email: 'moses@chazon.com',
        name: 'Moses Tumusiime',
        password: hashedPassword,
        role: 'STEWARD',
        image: stewardAvatars.moses,
        stewardProfile: {
          create: {
            bio: 'Licensed plumber with 10+ years of experience. Expert in pipe repairs, bathroom installations, and water heater systems. Available for emergencies.',
            rating: 4.7,
            completedTasks: 28,
            backgroundCheckStatus: 'CLEARED',
            status: 'APPROVED',
            latitude: 0.3324,
            longitude: 32.5825,
            serviceRadius: 30,
            services: {
              create: [
                {
                  title: 'Pipe Leak Repair',
                  description:
                    'Fix leaking pipes in kitchens, bathrooms, and outdoor areas. Includes pipe patching or replacement if needed.',
                  category: 'Plumbing',
                  price: 55000,
                  pricingType: 'FLAT',
                  duration: 90,
                  images: [serviceImages.plumbing[0]],
                },
                {
                  title: 'Bathroom Renovation',
                  description:
                    'Complete bathroom upgrade including new fixtures, piping, and tiling. Free consultation and quote provided.',
                  category: 'Plumbing',
                  price: 350000,
                  pricingType: 'FLAT',
                  duration: 480,
                  images: [serviceImages.plumbing[1]],
                },
                {
                  title: 'Water Heater Installation',
                  description:
                    'Professional installation of electric and solar water heaters. Includes testing and demo of all functions.',
                  category: 'Plumbing',
                  price: 120000,
                  pricingType: 'FLAT',
                  duration: 180,
                  images: [serviceImages.plumbing[2]],
                },
              ],
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
    console.log('Created steward: Moses Tumusiime (Plumbing)');
  }

  // ========== STEWARD 4: Grace Namuli (Cleaning) ==========
  const graceProfile = await prisma.stewardProfile.findUnique({
    where: { userId: 'steward-grace-id' },
  });

  if (!graceProfile) {
    await prisma.user.upsert({
      where: { email: 'grace@chazon.com' },
      update: {},
      create: {
        id: 'steward-grace-id',
        email: 'grace@chazon.com',
        name: 'Grace Namuli',
        password: hashedPassword,
        role: 'STEWARD',
        image: stewardAvatars.grace,
        stewardProfile: {
          create: {
            bio: 'Detail-oriented cleaner specializing in residential homes and apartments. Uses eco-friendly products. Great with pets and children. References available.',
            rating: 4.8,
            completedTasks: 19,
            backgroundCheckStatus: 'CLEARED',
            status: 'APPROVED',
            latitude: 0.3156,
            longitude: 32.5911,
            serviceRadius: 15,
            services: {
              create: [
                {
                  title: 'Standard House Cleaning',
                  description:
                    'Regular cleaning service for homes. Includes dusting, vacuuming, mopping, bathroom and kitchen cleaning.',
                  category: 'Cleaning',
                  price: 55000,
                  pricingType: 'FLAT',
                  duration: 150,
                  images: [serviceImages.cleaning[1]],
                },
                {
                  title: 'Move-In/Move-Out Cleaning',
                  description:
                    'Deep cleaning for empty properties. Ensures the space is spotless for the next occupants.',
                  category: 'Cleaning',
                  price: 95000,
                  pricingType: 'FLAT',
                  duration: 240,
                  images: [serviceImages.cleaning[0]],
                },
                {
                  title: 'Eco-Friendly Cleaning',
                  description:
                    'Cleaning using only organic, non-toxic products. Safe for children, pets, and allergy sufferers.',
                  category: 'Cleaning',
                  price: 75000,
                  pricingType: 'FLAT',
                  duration: 180,
                  images: [serviceImages.cleaning[3]],
                },
              ],
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
    console.log('Created steward: Grace Namuli (Cleaning)');
  }

  // ========== STEWARD 5: Joseph Kato (Handyman) ==========
  const josephProfile = await prisma.stewardProfile.findUnique({
    where: { userId: 'steward-joseph-id' },
  });

  if (!josephProfile) {
    await prisma.user.upsert({
      where: { email: 'joseph@chazon.com' },
      update: {},
      create: {
        id: 'steward-joseph-id',
        email: 'joseph@chazon.com',
        name: 'Joseph Kato',
        password: hashedPassword,
        role: 'STEWARD',
        image: stewardAvatars.joseph,
        stewardProfile: {
          create: {
            bio: 'Experienced handyman for all home improvement projects. From minor repairs to major installations. Fair pricing and quality workmanship guaranteed.',
            rating: 4.6,
            completedTasks: 41,
            backgroundCheckStatus: 'CLEARED',
            status: 'APPROVED',
            latitude: 0.3236,
            longitude: 32.575,
            serviceRadius: 25,
            services: {
              create: [
                {
                  title: 'Full Home Repair Assessment',
                  description:
                    'Comprehensive inspection of your home with a detailed report and quote for all needed repairs.',
                  category: 'Handyman',
                  price: 75000,
                  pricingType: 'FLAT',
                  duration: 180,
                  images: [serviceImages.handyman[1]],
                },
                {
                  title: 'Curtain & Blinds Installation',
                  description:
                    'Professional installation of curtains, blinds, and window treatments. Hardware included.',
                  category: 'Handyman',
                  price: 35000,
                  pricingType: 'FLAT',
                  duration: 90,
                  images: [serviceImages.handyman[2]],
                },
                {
                  title: 'Shelf & Storage Installation',
                  description:
                    'Install wall shelves, storage units, and closet systems. All mounting hardware provided.',
                  category: 'Handyman',
                  price: 40000,
                  pricingType: 'FLAT',
                  duration: 120,
                  images: [serviceImages.handyman[0]],
                },
                {
                  title: 'Appliance Installation',
                  description:
                    'Installation of washing machines, dryers, dishwashers, and other appliances. Old appliance removal available.',
                  category: 'Handyman',
                  price: 50000,
                  pricingType: 'FLAT',
                  duration: 120,
                  images: [serviceImages.handyman[1]],
                },
              ],
            },
            availability: {
              create: [
                { dayOfWeek: 1, startTime: '08:00', endTime: '17:00' },
                { dayOfWeek: 2, startTime: '08:00', endTime: '17:00' },
                { dayOfWeek: 3, startTime: '08:00', endTime: '17:00' },
                { dayOfWeek: 4, startTime: '08:00', endTime: '17:00' },
                { dayOfWeek: 5, startTime: '08:00', endTime: '17:00' },
                { dayOfWeek: 6, startTime: '09:00', endTime: '14:00' },
              ],
            },
          },
        },
      },
    });
    console.log('Created steward: Joseph Kato (Handyman)');
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

  console.log('✅ Seeding completed!');
  console.log('\nTest Accounts:');
  console.log('Admin: admin@chazon.com / password123');
  console.log('Client: alice@chazon.com / password123');
  console.log(
    'Stewards: ronald@chazon.com, david@chazon.com, moses@chazon.com, grace@chazon.com, joseph@chazon.com'
  );
  console.log('All passwords: password123');
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
