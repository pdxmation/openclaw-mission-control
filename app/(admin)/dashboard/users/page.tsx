import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      stripeSubscription: {
        select: {
          status: true,
          tier: true,
          currentPeriodEnd: true,
        }
      },
      _count: {
        select: {
          ownedTasks: true,
          projects: true,
          documents: true,
        }
      }
    }
  })

  const getSubscriptionBadge = (user: typeof users[0]) => {
    if (user.stripeSubscription) {
      const status = user.stripeSubscription.status
      if (status === 'active') {
        return <Badge className="bg-primary">Pro</Badge>
      }
      if (status === 'trialing') {
        return <Badge variant="outline">Trialing</Badge>
      }
      return <Badge variant="destructive">{status}</Badge>
    }

    if (user.subscriptionTier === 'trial') {
      if (user.trialEndDate && new Date(user.trialEndDate) < new Date()) {
        return <Badge variant="destructive">Trial Expired</Badge>
      }
      return <Badge variant="outline">Trial</Badge>
    }

    return <Badge variant="outline">{user.subscriptionTier}</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">Manage registered users</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>{users.length} total users</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No users yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Docs</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getSubscriptionBadge(user)}</TableCell>
                    <TableCell>{user._count.ownedTasks}</TableCell>
                    <TableCell>{user._count.projects}</TableCell>
                    <TableCell>{user._count.documents}</TableCell>
                    <TableCell>
                      {user.isAdmin ? (
                        <Badge className="bg-primary">Admin</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
