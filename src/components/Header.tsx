'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, FileText, Users } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Tasks', icon: LayoutGrid },
  { href: '/docs', label: 'Docs', icon: FileText },
  { href: '/people', label: 'People', icon: Users },
]

export function Header() {
  const pathname = usePathname()

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-[1800px] mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">MC</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Mission Control</h1>
              <p className="text-xs text-muted-foreground -mt-0.5">R2&apos;s Dashboard</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                    transition-colors
                    ${isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'}
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Right side - could add user menu later */}
          <div className="w-32" /> {/* Spacer for balance */}
        </div>
      </div>
    </header>
  )
}
