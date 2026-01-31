'use server'

import { requireUser } from '@/lib/admin/auth'
import {
  createCheckoutSession,
  createBillingPortalSession,
} from '@/lib/stripe/stripe-service'

export async function createCheckout(billingPeriod: 'monthly' | 'yearly') {
  const user = await requireUser()
  return createCheckoutSession(user.id, billingPeriod)
}

export async function openBillingPortal() {
  const user = await requireUser()
  return createBillingPortalSession(user.id)
}
