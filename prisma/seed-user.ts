import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
})
const prisma = new PrismaClient({ adapter })

async function main() {
  // Create admin user (Pavel)
  const user = await prisma.user.upsert({
    where: { email: 'pavel@xmation.ai' },
    update: {},
    create: {
      email: 'pavel@xmation.ai',
      name: 'Pavel Dovhomilja',
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
