import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Marketing Header */}
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/home" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">MC</span>
              </div>
              <span className="text-lg font-bold">Mission Control</span>
            </Link>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/home" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Home
              </Link>
              <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
            </nav>

            {/* CTA */}
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/waitlist">
                <Button size="sm">
                  Join Waitlist
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">MC</span>
                </div>
                <span className="text-lg font-bold">Mission Control</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm">
                AI-powered task management and project tracking. Stay organized, ship faster.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/waitlist" className="hover:text-foreground transition-colors">Join Waitlist</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-4">Account</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/login" className="hover:text-foreground transition-colors">Log in</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Mission Control. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
