import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding ...')
  
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create Clients
  const client1 = await prisma.user.upsert({
    where: { email: 'alice@chazon.com' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'alice@chazon.com',
      name: 'Alice Client',
      password: hashedPassword,
      role: 'CLIENT',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    },
  })

  const client2 = await prisma.user.upsert({
    where: { email: 'bob@chazon.com' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'bob@chazon.com',
      name: 'Bob Client',
      password: hashedPassword,
      role: 'CLIENT',
    },
  })

  // Create Stewards
  const steward1 = await prisma.user.upsert({
    where: { email: 'charlie@chazon.com' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'charlie@chazon.com',
      name: 'Charlie Steward',
      password: hashedPassword,
      role: 'STEWARD',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
      stewardProfile: {
        create: {
          bio: 'Expert cleaner with 5 years of experience.',
          rating: 4.8,
          completedTasks: 120,
          backgroundCheckStatus: 'CLEARED',
          latitude: 0.3476, // Kampala approx
          longitude: 32.5825,
          services: {
            create: [
              {
                title: 'Deep House Cleaning',
                description: 'Complete home cleaning service',
                category: 'cleaning',
                price: 50000,
                pricingType: 'HOURLY',
              },
              {
                title: 'Office Cleaning',
                description: 'Professional office space cleaning',
                category: 'cleaning',
                price: 70000,
                pricingType: 'HOURLY',
              },
            ],
          },
          availability: {
            create: [
              { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }, // Mon
              { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' }, // Tue
              { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' }, // Wed
            ],
          },
        },
      },
    },
  })

  const steward2 = await prisma.user.upsert({
    where: { email: 'diana@chazon.com' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'diana@chazon.com',
      name: 'Diana Plumber',
      password: hashedPassword,
      role: 'STEWARD',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
      stewardProfile: {
        create: {
          bio: 'Licensed plumber available for emergencies.',
          rating: 4.9,
          completedTasks: 85,
          backgroundCheckStatus: 'CLEARED',
          latitude: 0.3136,
          longitude: 32.5811,
          services: {
            create: [
              {
                title: 'Leak Repair',
                description: 'Fixing leaks in pipes and faucets',
                category: 'plumbing',
                price: 100000,
                pricingType: 'FLAT',
              },
            ],
          },
        },
      },
    },
  })

  console.log({ client1, client2, steward1, steward2 })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
