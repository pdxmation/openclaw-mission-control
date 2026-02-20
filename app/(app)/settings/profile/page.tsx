import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/admin/auth'
import { ProfileForm } from '@/components/profile/ProfileForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProfilePage() {
  const user = await requireUser()

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      telegram: true,
      github: true,
      timezone: true,
      wakeTime: true,
      location: true,
      communicationStyle: true,
      workStartTime: true,
      workEndTime: true,
      preferences: true,
      shortTermGoals: true,
      mediumTermGoals: true,
      longTermGoals: true,
      techStack: true,
      currentFocus: true,
      myMission: true,
      notes: true,
      // Personal
      children: true,
      partner: true,
      pets: true,
      hobbies: true,
      // Health
      exerciseRoutine: true,
      sleepTarget: true,
      healthFocus: true,
      // Business
      monthlyRevenueTarget: true,
      currentRunway: true,
      teamSize: true,
      keyMetrics: true,
      // Productivity
      preferredAsyncTools: true,
      decisionFatigueTriggers: true,
      deepWorkHours: true,
    }
  })

  if (!profile) {
    throw new Error('Profile not found')
  }

  // Fetch user's businesses
  const businesses = await prisma.business.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      name: true,
      description: true,
      industry: true,
      isPrimary: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return <ProfileForm initialProfile={profile} initialBusinesses={businesses} />
}
