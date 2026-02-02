import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireUser } from '@/lib/admin/auth'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

function calculateTrialDaysLeft(trialEndDate: Date | null): number | null {
  if (!trialEndDate) return null
  const now = new Date()
  const diff = trialEndDate.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default async function SettingsPage() {
  const user = await requireUser()

  const trialDaysLeft = calculateTrialDaysLeft(user.trialEndDate)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Name</label>
            <p className="text-lg">{user.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <p className="text-lg">{user.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Email Verified</label>
            <p>
              {user.emailVerified ? (
                <Badge className="bg-primary">Verified</Badge>
              ) : (
                <Badge variant="outline">Not verified</Badge>
              )}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Member Since</label>
            <p className="text-lg">
              {new Date(user.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Your current plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Plan</label>
            <p className="text-lg flex items-center gap-2">
              {user.subscriptionTier === 'pro' ? (
                <Badge className="bg-primary">Pro</Badge>
              ) : (
                <Badge variant="outline">Trial</Badge>
              )}
            </p>
          </div>
          {user.subscriptionTier === 'trial' && trialDaysLeft !== null && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Trial Status</label>
              <p className="text-lg">
                {trialDaysLeft > 0 ? (
                  <span>{trialDaysLeft} days remaining</span>
                ) : (
                  <span className="text-destructive">Trial expired</span>
                )}
              </p>
            </div>
          )}
          {user.isAdmin && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Admin Access</label>
              <p>
                <Badge className="bg-primary">Admin</Badge>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
