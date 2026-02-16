import Link from 'next/link'
import { Settings, Key, CreditCard, User } from 'lucide-react'

const settingsNavItems = [
  { href: '/settings/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'General', icon: Settings },
  { href: '/settings/api-keys', label: 'API Keys', icon: Key },
  { href: '/settings/billing', label: 'Billing', icon: CreditCard },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Settings nav */}
        <nav className="md:w-48 shrink-0">
          <ul className="space-y-1">
            {settingsNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}
