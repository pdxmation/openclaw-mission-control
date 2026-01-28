import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
})
const prisma = new PrismaClient({ adapter })

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminName = process.env.ADMIN_NAME || 'Admin'

  if (!adminEmail) {
    console.error('❌ ADMIN_EMAIL environment variable is required')
    process.exit(1)
  }

  // Create admin user
  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: adminName,
      emailVerified: true,
    }
  })

  console.log('✅ Admin user created/verified:', user.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
