'use server'
import { requireUser } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'

export async function getCronJobs() {
  const user = await requireUser()
  return prisma.cronJob.findMany({
    where: { userId: user.id },
    orderBy: [{ agentId: 'asc' }, { nextRunAt: 'asc' }],
  })
}
