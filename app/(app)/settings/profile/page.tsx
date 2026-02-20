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
      company: true,
      companyLegal: true,
      product: true,
      stage: true,
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
    }
  })

  if (!profile) {
    throw new Error('Profile not found')
  }

  return <ProfileForm initialProfile={profile} />
}
