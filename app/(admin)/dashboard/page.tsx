import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { Users, ClipboardList, CreditCard, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const [
    totalUsers,
    waitlistPending,
    waitlistApproved,
    activeSubscriptions,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.waitingList.count({ where: { status: 'pending' } }),
    prisma.waitingList.count({ where: { status: 'approved' } }),
    prisma.stripeSubscription.count({ where: { status: 'active' } }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        subscriptionTier: true,
      }
    }),
  ])

  const stats = [
    {
      title: 'Total Users',
      value: totalUsers,
      icon: Users,
      description: 'Registered accounts',
    },
    {
      title: 'Waitlist Pending',
      value: waitlistPending,
      icon: ClipboardList,
      description: 'Awaiting approval',
      href: '/dashboard/waiting-list',
    },
    {
      title: 'Waitlist Approved',
      value: waitlistApproved,
      icon: CheckCircle2,
      description: 'Invitations sent',
    },
    {
      title: 'Active Subscriptions',
      value: activeSubscriptions,
      icon: CreditCard,
      description: 'Paying customers',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your Mission Control instance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              {stat.href && (
                <Link href={stat.href}>
                  <Button variant="link" size="sm" className="px-0 mt-2">
                    View all &rarr;
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
          <CardDescription>Latest user registrations</CardDescription>
        </CardHeader>
        <CardContent>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users yet</p>
          ) : (
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      {user.subscriptionTier === 'pro' ? (
                        <span className="text-primary">Pro</span>
                      ) : (
                        <span className="text-muted-foreground">Trial</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link href="/dashboard/users">
            <Button variant="outline" size="sm" className="mt-4">
              View all users
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
