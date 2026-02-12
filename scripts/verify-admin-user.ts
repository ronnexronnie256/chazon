/**
 * Script to verify if a user qualifies as admin
 * Run with: npx tsx scripts/verify-admin-user.ts
 */
import { prisma } from '../lib/prisma'

async function verifyAdminUser() {
  const userId = 'c4748dab-413d-4824-bf6f-730af2e61004'
  const email = 'motreligna@necub.com'

  try {
    // Check if user exists in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) {
      console.log('❌ User not found in database')
      console.log('User needs to be created first')
      return
    }

    console.log('✅ User found in database:')
    console.log(JSON.stringify(user, null, 2))

    // Check role
    if (user.role === 'ADMIN') {
      console.log('\n✅ User has ADMIN role - They qualify for admin access!')
      console.log('\nAdmin features they can access:')
      console.log('- /admin/stewards - Steward application management')
      console.log('- All admin API endpoints')
      console.log('- Admin menu items in header')
    } else {
      console.log(`\n⚠️  User role is "${user.role}" - Not an admin`)
      console.log('To make them admin, update their role in the database:')
      console.log(`UPDATE "User" SET role = 'ADMIN' WHERE id = '${userId}';`)
    }

    // Also check by email
    const userByEmail = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    if (userByEmail && userByEmail.id !== userId) {
      console.log('\n⚠️  Found different user with same email:', userByEmail)
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyAdminUser()

