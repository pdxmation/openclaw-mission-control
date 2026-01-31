import { stripe, isStripeConfigured } from './stripe-client'
import { prisma } from '../prisma'
import {
  SUBSCRIPTION_TIERS,
  EARLY_ADOPTER_MAX_USERS,
} from './subscription-tiers'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export interface CreateCheckoutResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Check if early adopter pricing is available
 */
export async function isEarlyAdopterAvailable(): Promise<boolean> {
  const paidUsers = await prisma.stripeSubscription.count({
    where: {
      status: { in: ['active', 'trialing'] }
    }
  })
  return paidUsers < EARLY_ADOPTER_MAX_USERS
}

/**
 * Get the appropriate tier for a new user
 */
export async function getAvailableTier(): Promise<'pro_early' | 'pro'> {
  const isEarlyAdopter = await isEarlyAdopterAvailable()
  return isEarlyAdopter ? 'pro_early' : 'pro'
}

/**
 * Create a Stripe checkout session
 */
export async function createCheckoutSession(
  userId: string,
  billingPeriod: 'monthly' | 'yearly'
): Promise<CreateCheckoutResult> {
  if (!isStripeConfigured() || !stripe) {
    return { success: false, error: 'Stripe is not configured' }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { stripeSubscription: true }
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Determine which tier to use
    const tier = await getAvailableTier()
    const tierConfig = SUBSCRIPTION_TIERS[tier]
    const priceId = billingPeriod === 'monthly'
      ? tierConfig.monthlyPriceId
      : tierConfig.yearlyPriceId

    if (!priceId) {
      return { success: false, error: 'Price not configured for this tier' }
    }

    // Get or create Stripe customer
    let stripeCustomerId = user.stripeSubscription?.stripeCustomerId

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id,
        }
      })
      stripeCustomerId = customer.id
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        }
      ],
      success_url: `${APP_URL}/settings/billing?success=true`,
      cancel_url: `${APP_URL}/settings/billing?canceled=true`,
      subscription_data: {
        metadata: {
          userId: user.id,
          tier,
        }
      },
      metadata: {
        userId: user.id,
        tier,
      }
    })

    return { success: true, url: session.url || undefined }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return { success: false, error: 'Failed to create checkout session' }
  }
}

/**
 * Create a Stripe billing portal session
 */
export async function createBillingPortalSession(
  userId: string
): Promise<CreateCheckoutResult> {
  if (!isStripeConfigured() || !stripe) {
    return { success: false, error: 'Stripe is not configured' }
  }

  try {
    const subscription = await prisma.stripeSubscription.findUnique({
      where: { userId }
    })

    if (!subscription) {
      return { success: false, error: 'No subscription found' }
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${APP_URL}/settings/billing`,
    })

    return { success: true, url: session.url }
  } catch (error) {
    console.error('Error creating billing portal session:', error)
    return { success: false, error: 'Failed to create billing portal session' }
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(userId: string): Promise<{ success: boolean; error?: string }> {
  if (!isStripeConfigured() || !stripe) {
    return { success: false, error: 'Stripe is not configured' }
  }

  try {
    const subscription = await prisma.stripeSubscription.findUnique({
      where: { userId }
    })

    if (!subscription) {
      return { success: false, error: 'No subscription found' }
    }

    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId)

    return { success: true }
  } catch (error) {
    console.error('Error canceling subscription:', error)
    return { success: false, error: 'Failed to cancel subscription' }
  }
}

/**
 * Get subscription details from Stripe
 */
export async function getSubscriptionDetails(userId: string) {
  if (!isStripeConfigured() || !stripe) {
    return null
  }

  try {
    const subscription = await prisma.stripeSubscription.findUnique({
      where: { userId }
    })

    if (!subscription) {
      return null
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    )

    const subData = stripeSubscription as unknown as {
      status: string
      current_period_end: number
      cancel_at_period_end: boolean
    }

    return {
      status: subData.status,
      currentPeriodEnd: new Date(subData.current_period_end * 1000),
      cancelAtPeriodEnd: subData.cancel_at_period_end,
    }
  } catch (error) {
    console.error('Error fetching subscription details:', error)
    return null
  }
}
