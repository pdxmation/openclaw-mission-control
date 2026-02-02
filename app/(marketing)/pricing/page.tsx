import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2 } from 'lucide-react'
import {
  SUBSCRIPTION_TIERS,
  formatPrice,
  getYearlySavings,
  EARLY_ADOPTER_MAX_USERS
} from '@/lib/stripe/subscription-tiers'

export default function PricingPage() {
  const trialTier = SUBSCRIPTION_TIERS.trial
  const earlyTier = SUBSCRIPTION_TIERS.pro_early
  const proTier = SUBSCRIPTION_TIERS.pro

  return (
    <div className="py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, transparent pricing</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start with a free trial. Upgrade when you&apos;re ready.
            Early adopters get locked-in pricing forever.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Trial */}
          <Card className="relative">
            <CardHeader>
              <CardTitle>{trialTier.name}</CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">Free</span>
                <span className="text-muted-foreground ml-2">for 7 days</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {trialTier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/waitlist">
                <Button variant="outline" className="w-full">
                  Join Waitlist
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Pro (Early Adopter) */}
          <Card className="relative border-primary">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary">Early Adopter Pricing</Badge>
            </div>
            <CardHeader className="pt-8">
              <CardTitle>{earlyTier.name}</CardTitle>
              <CardDescription>
                Limited to first {EARLY_ADOPTER_MAX_USERS} users
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">{formatPrice(earlyTier.monthlyPrice)}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <div className="text-sm text-muted-foreground">
                or {formatPrice(earlyTier.yearlyPrice)}/year ({getYearlySavings(earlyTier)}% off)
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {earlyTier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/waitlist">
                <Button className="w-full">
                  Get Early Access
                </Button>
              </Link>
              <p className="mt-3 text-xs text-center text-muted-foreground">
                Lock in this rate forever
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Regular pricing note */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            After {EARLY_ADOPTER_MAX_USERS} users, the Pro plan will be{' '}
            <span className="font-medium text-foreground">{formatPrice(proTier.monthlyPrice)}/month</span>{' '}
            or{' '}
            <span className="font-medium text-foreground">{formatPrice(proTier.yearlyPrice)}/year</span>.
          </p>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">What happens after my trial ends?</h3>
              <p className="text-sm text-muted-foreground">
                You&apos;ll need to subscribe to continue using Mission Control. Your data
                is kept safe during the transition.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">What does &quot;early adopter pricing&quot; mean?</h3>
              <p className="text-sm text-muted-foreground">
                The first {EARLY_ADOPTER_MAX_USERS} paying customers get a permanently discounted rate of{' '}
                {formatPrice(earlyTier.monthlyPrice)}/month (instead of {formatPrice(proTier.monthlyPrice)}/month).
                This price is locked in for as long as you remain a subscriber.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Can I cancel anytime?</h3>
              <p className="text-sm text-muted-foreground">
                Yes, you can cancel your subscription at any time. You&apos;ll retain access
                until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Is there a refund policy?</h3>
              <p className="text-sm text-muted-foreground">
                We offer a 14-day money-back guarantee for annual subscriptions. Monthly
                subscriptions are non-refundable but you can cancel anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
