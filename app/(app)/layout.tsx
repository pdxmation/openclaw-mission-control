import { redirect } from 'next/navigation'
import { Header } from '@/components/Header'
import { getCurrentSession } from '@/lib/admin/auth'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getCurrentSession()

  if (!session?.user?.id) {
    redirect('/login')
  }

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>
    </>
  )
}
