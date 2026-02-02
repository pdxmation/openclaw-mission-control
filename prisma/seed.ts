import 'dotenv/config'
import { PrismaClient, Priority } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
})
const prisma = new PrismaClient({ adapter })

// Seed data from existing MISSION_CONTROL.md
const seedData = {
  inProgress: [
    { task: 'GSuite integration', started: '2026-01-28', status: 'Blocked', notes: 'Needs OAuth credentials setup' },
    { task: 'Website copy review', started: '2026-01-28', status: 'Queued', notes: 'Awaiting go-ahead' }
  ],
  backlog: [
    { task: 'Morning brief system', priority: 'High', notes: 'Need wake time, then set up cron' },
    { task: 'Content calendar', priority: 'Medium', notes: 'Blog/social strategy' },
    { task: 'Lead gen research', priority: 'Medium', notes: 'Channels, tactics for Xmation' },
    { task: 'SEO analysis', priority: 'Medium', notes: '"AI zaměstnanec" keyword opportunities' },
    { task: 'Case study template', priority: 'Medium', notes: 'Help get customer testimonials' }
  ],
  completed: [
    { task: 'Telegram pairing', completed: '2026-01-28', outcome: 'Connected' },
    { task: 'Browser setup', completed: '2026-01-28', outcome: 'Clawd profile running' },
    { task: 'Xmation.ai deep dive', completed: '2026-01-28', outcome: 'Full product/pricing analysis' },
    { task: 'Competitor research', completed: '2026-01-28', outcome: '8 competitors analyzed → projects/competitor-analysis.md' },
    { task: 'Workspace setup', completed: '2026-01-28', outcome: 'MISSION_CONTROL, USER.md, projects/' },
    { task: 'Morning brief cron', completed: '2026-01-28', outcome: 'Daily 07:45 CET → Telegram' }
  ],
  blocked: [
    { task: 'GSuite monitoring', blocker: 'No OAuth', need: 'Credentials from Google Cloud Console' },
    { task: 'Xmation codebase', blocker: 'No access', need: 'Repo location (private? org?)' }
  ]
}

function parsePriority(p: string): Priority {
  switch (p.toLowerCase()) {
    case 'critical': return 'CRITICAL'
    case 'high': return 'HIGH'
    case 'low': return 'LOW'
    default: return 'MEDIUM'
  }
}

function parseDate(dateStr: string): Date {
  return new Date(dateStr)
}

async function main() {
  console.log('🌱 Seeding database...')

  // Get or create a seed user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
  let seedUser = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (!seedUser) {
    seedUser = await prisma.user.create({
      data: {
        name: 'Admin',
        email: adminEmail,
        emailVerified: true,
        isAdmin: true,
        subscriptionTier: 'pro',
      }
    })
    console.log(`✅ Created seed user: ${seedUser.email}`)
  }

  // Clear existing tasks for this user
  await prisma.task.deleteMany({
    where: { userId: seedUser.id }
  })

  // Seed in progress tasks
  for (const item of seedData.inProgress) {
    await prisma.task.create({
      data: {
        title: item.task,
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        startedAt: parseDate(item.started),
        statusNote: item.status,
        notes: item.notes,
        userId: seedUser.id,
      }
    })
  }

  // Seed backlog tasks
  for (const item of seedData.backlog) {
    await prisma.task.create({
      data: {
        title: item.task,
        status: 'BACKLOG',
        priority: parsePriority(item.priority),
        notes: item.notes,
        userId: seedUser.id,
      }
    })
  }

  // Seed completed tasks
  for (const item of seedData.completed) {
    await prisma.task.create({
      data: {
        title: item.task,
        status: 'COMPLETED',
        priority: 'MEDIUM',
        completedAt: parseDate(item.completed),
        outcome: item.outcome,
        userId: seedUser.id,
      }
    })
  }

  // Seed blocked tasks
  for (const item of seedData.blocked) {
    await prisma.task.create({
      data: {
        title: item.task,
        status: 'BLOCKED',
        priority: 'MEDIUM',
        blocker: item.blocker,
        need: item.need,
        userId: seedUser.id,
      }
    })
  }

  const count = await prisma.task.count()
  console.log(`✅ Seeded ${count} tasks`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
