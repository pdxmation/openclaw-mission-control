import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/admin/auth'

export default async function RootPage() {
  const session = await getCurrentSession()

  if (session?.user) {
    // User is logged in - redirect to app
    redirect('/tasks')
  } else {
    // User is not logged in - redirect to marketing page
    redirect('/home')
  }
}
