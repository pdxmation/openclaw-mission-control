'use client'

import { Suspense, useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Loader2, ExternalLink, AlertCircle } from 'lucide-react'
import {
  SUBSCRIPTION_TIERS,
  formatPrice,
  getYearlySavings,
} from '@/lib/stripe/subscription-tiers'
import { createCheckout, openBillingPortal } from './actions'

function BillingContent() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  const handleUpgrade = () => {
    setError('')
    startTransition(async () => {
      const result = await createCheckout(billingPeriod)
      if (result.success && result.url) {
        window.location.href = result.url
      } else {
        setError(result.error || 'Failed to create checkout session')
      }
    })
  }

  const handleManageBilling = () => {
    setError('')
    startTransition(async () => {
      const result = await openBillingPortal()
      if (result.success && result.url) {
        window.location.href = result.url
      } else {
        setError(result.error || 'Failed to open billing portal')
      }
    })
  }

  const earlyTier = SUBSCRIPTION_TIERS.pro_early
  const proTier = SUBSCRIPTION_TIERS.pro

  // Use early adopter pricing for now (can add logic to check user count)
  const activeTier = earlyTier

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Payment successful!</p>
            <p className="text-sm text-muted-foreground">
              Your subscription is now active. Thank you for upgrading!
            </p>
          </div>
        </div>
      )}

      {canceled && (
        <div className="p-4 bg-muted border border-border rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">Payment canceled</p>
            <p className="text-sm text-muted-foreground">
              No charges were made. You can try again when you&apos;re ready.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your subscription status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">Trial</p>
              <p className="text-sm text-muted-foreground">
                Upgrade to unlock unlimited features
              </p>
            </div>
            <Button variant="outline" onClick={handleManageBilling} disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Manage Billing
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Upgrade to Pro</CardTitle>
              <CardDescription>Unlock all features and remove limits</CardDescription>
            </div>
            <Badge className="bg-primary">Early Adopter Pricing</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Billing Period Toggle */}
          <div className="flex items-center justify-center gap-2 mb-6 p-1 bg-muted rounded-lg w-fit mx-auto">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-background shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingPeriod === 'yearly'
                  ? 'bg-background shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
              <span className="ml-1 text-xs text-primary">
                (Save {getYearlySavings(activeTier)}%)
              </span>
            </button>
          </div>

          {/* Price */}
          <div className="text-center mb-6">
            <div className="text-4xl font-bold">
              {billingPeriod === 'monthly'
                ? formatPrice(activeTier.monthlyPrice)
                : formatPrice(activeTier.yearlyPrice)}
            </div>
            <div className="text-muted-foreground">
              {billingPeriod === 'monthly' ? '/month' : '/year'}
            </div>
            {billingPeriod === 'yearly' && (
              <div className="text-sm text-muted-foreground mt-1">
                ({formatPrice(Math.round(activeTier.yearlyPrice / 12))}/month billed annually)
              </div>
            )}
            <div className="text-sm text-muted-foreground mt-2">
              <s className="text-muted-foreground/50">
                {billingPeriod === 'monthly'
                  ? formatPrice(proTier.monthlyPrice)
                  : formatPrice(proTier.yearlyPrice)}
              </s>{' '}
              regular price
            </div>
          </div>

          {/* Features */}
          <ul className="space-y-3 mb-6">
            {activeTier.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <Button className="w-full" size="lg" onClick={handleUpgrade} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Upgrade Now'
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Cancel anytime. No questions asked.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  )
}
