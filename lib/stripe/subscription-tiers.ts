export interface SubscriptionTierConfig {
  name: string
  monthlyPriceId: string | null
  yearlyPriceId: string | null
  monthlyPrice: number // in cents
  yearlyPrice: number // in cents
  maxUsers?: number // for early adopter tier
  features: string[]
}

export const TRIAL_DURATION_DAYS = 7
export const EARLY_ADOPTER_MAX_USERS = 200

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTierConfig> = {
  trial: {
    name: 'Trial',
    monthlyPriceId: null,
    yearlyPriceId: null,
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Full access for 7 days',
      'All features included',
      'No credit card required',
    ],
  },
  pro_early: {
    name: 'Pro (Early Adopter)',
    monthlyPriceId: process.env.STRIPE_PRICE_ID_EARLY_MONTHLY || null,
    yearlyPriceId: process.env.STRIPE_PRICE_ID_EARLY_YEARLY || null,
    monthlyPrice: 900, // $9
    yearlyPrice: 8640, // $86.40 (rounded to $86)
    maxUsers: EARLY_ADOPTER_MAX_USERS,
    features: [
      'Lifetime early adopter rate',
      'Unlimited tasks',
      'Unlimited projects',
      'API access',
      'Priority support',
    ],
  },
  pro: {
    name: 'Pro',
    monthlyPriceId: process.env.STRIPE_PRICE_ID_MONTHLY || null,
    yearlyPriceId: process.env.STRIPE_PRICE_ID_YEARLY || null,
    monthlyPrice: 1900, // $19
    yearlyPrice: 18240, // $182.40 (rounded to $182)
    features: [
      'Unlimited tasks',
      'Unlimited projects',
      'API access',
      'Priority support',
    ],
  },
}

/**
 * Format price for display (from cents to dollars)
 */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

/**
 * Calculate yearly savings percentage
 */
export function getYearlySavings(tier: SubscriptionTierConfig): number {
  if (tier.monthlyPrice === 0) return 0
  const yearlyAtMonthlyRate = tier.monthlyPrice * 12
  return Math.round((1 - tier.yearlyPrice / yearlyAtMonthlyRate) * 100)
}
