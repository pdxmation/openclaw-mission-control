import { Metadata } from 'next'
import { requireUser } from '@/lib/admin/auth'
import { SecondBrainLayout } from '@/components/second-brain/SecondBrainLayout'

export const metadata: Metadata = {
  title: 'Second Brain | Mission Control',
  description: 'Obsidian-style knowledge management',
}

export const dynamic = 'force-dynamic'

export default async function SecondBrainPage() {
  const user = await requireUser()

  return (
    <div className="h-[calc(100vh-4rem)]">
      <SecondBrainLayout userId={user.id} />
    </div>
  )
}
