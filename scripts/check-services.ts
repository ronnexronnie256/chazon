
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

// Load .env manually
const envPath = path.resolve(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8')
  envConfig.split('\n').forEach(line => {
    // Skip comments and empty lines
    if (!line || line.startsWith('#')) return

    const firstEqual = line.indexOf('=')
    if (firstEqual === -1) return

    const key = line.substring(0, firstEqual).trim()
    let value = line.substring(firstEqual + 1).trim()

    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    process.env[key] = value
  })
}

const prisma = new PrismaClient()

async function main() {
  const services = await prisma.serviceOffering.findMany({
    include: {
      steward: {
        include: {
          user: true
        }
      }
    }
  })

  console.log('Services found:', services.length)
  services.forEach(s => {
    console.log(`- ID: ${s.id}, Title: ${s.title}, Steward: ${s.steward.user.name}`)
  })
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
