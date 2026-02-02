import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is not set - Stripe features will be disabled')
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    })
  : null

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return stripe !== null
}
