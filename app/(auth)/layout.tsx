import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/admin/auth'
import Link from 'next/link'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getCurrentSession()

  // If user is already logged in, redirect to app
  if (session?.user?.id) {
    redirect('/tasks')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Simple header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/home" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">MC</span>
            </div>
            <span className="text-lg font-bold">Mission Control</span>
          </Link>
        </div>
      </header>

      {/* Centered content */}
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>

      {/* Simple footer */}
      <footer className="border-t border-border py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Mission Control
        </div>
      </footer>
    </div>
  )
}
