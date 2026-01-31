import Stripe from 'stripe'
import { prisma } from '../prisma'
import type { SubscriptionStatus } from '../../generated/prisma/client'

// Helper type for subscription data
interface SubscriptionData {
  status: string
  current_period_start: number
  current_period_end: number
}

function getSubscriptionData(sub: Stripe.Subscription): SubscriptionData {
  return sub as unknown as SubscriptionData
}

/**
 * Map Stripe subscription status to our enum
 */
function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'active':
      return 'active'
    case 'canceled':
      return 'canceled'
    case 'past_due':
      return 'past_due'
    case 'incomplete':
    case 'incomplete_expired':
      return 'incomplete'
    case 'trialing':
      return 'trialing'
    case 'paused':
    case 'unpaid':
    default:
      return 'canceled'
  }
}

/**
 * Handle checkout.session.completed event
 */
export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const userId = session.metadata?.userId
  const tier = session.metadata?.tier || 'pro'

  if (!userId) {
    console.error('No userId in checkout session metadata')
    return
  }

  if (!session.subscription || !session.customer) {
    console.error('No subscription or customer in checkout session')
    return
  }

  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription.id

  const customerId = typeof session.customer === 'string'
    ? session.customer
    : session.customer.id

  // Create or update subscription record
  await prisma.stripeSubscription.upsert({
    where: { userId },
    update: {
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId,
      tier,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Approximate, will be updated by webhook
    },
    create: {
      userId,
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId,
      tier,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }
  })

  // Update user subscription tier
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: 'pro',
    }
  })

  console.log(`Subscription created for user ${userId}`)
}

/**
 * Handle customer.subscription.updated event
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  const userId = subscription.metadata?.userId

  if (!userId) {
    // Try to find by subscription ID
    const existingSubscription = await prisma.stripeSubscription.findUnique({
      where: { stripeSubscriptionId: subscription.id }
    })

    if (!existingSubscription) {
      console.error('Cannot find user for subscription:', subscription.id)
      return
    }

    const subData = getSubscriptionData(subscription)
    await prisma.stripeSubscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: mapStripeStatus(subscription.status),
        currentPeriodStart: new Date(subData.current_period_start * 1000),
        currentPeriodEnd: new Date(subData.current_period_end * 1000),
      }
    })

    return
  }

  const subData = getSubscriptionData(subscription)
  await prisma.stripeSubscription.update({
    where: { userId },
    data: {
      status: mapStripeStatus(subscription.status),
      currentPeriodStart: new Date(subData.current_period_start * 1000),
      currentPeriodEnd: new Date(subData.current_period_end * 1000),
    }
  })

  console.log(`Subscription updated for user ${userId}`)
}

/**
 * Handle customer.subscription.deleted event
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const existingSubscription = await prisma.stripeSubscription.findUnique({
    where: { stripeSubscriptionId: subscription.id }
  })

  if (!existingSubscription) {
    console.error('Cannot find subscription:', subscription.id)
    return
  }

  // Update subscription status
  await prisma.stripeSubscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'canceled',
    }
  })

  // Downgrade user to trial (expired)
  await prisma.user.update({
    where: { id: existingSubscription.userId },
    data: {
      subscriptionTier: 'trial',
      trialEndDate: new Date(), // Trial is expired
    }
  })

  console.log(`Subscription deleted for user ${existingSubscription.userId}`)
}

/**
 * Handle invoice.payment_failed event
 */
export async function handlePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  // Access subscription from invoice data
  const invoiceData = invoice as unknown as { subscription?: string | { id: string } }
  if (!invoiceData.subscription) return

  const subscriptionId = typeof invoiceData.subscription === 'string'
    ? invoiceData.subscription
    : invoiceData.subscription.id

  const existingSubscription = await prisma.stripeSubscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId }
  })

  if (!existingSubscription) {
    console.error('Cannot find subscription:', subscriptionId)
    return
  }

  await prisma.stripeSubscription.update({
    where: { stripeSubscriptionId: subscriptionId },
    data: {
      status: 'past_due',
    }
  })

  console.log(`Payment failed for subscription ${subscriptionId}`)
}
