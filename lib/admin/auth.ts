import { headers } from 'next/headers'
import { auth } from '../auth'
import { prisma } from '../prisma'
import type { User } from '../../generated/prisma/client'

// Session type from Better Auth
type BetterAuthSession = Awaited<ReturnType<typeof auth.api.getSession>>

/**
 * Get the current session from Better Auth
 * Returns null if not authenticated
 */
export async function getCurrentSession(): Promise<BetterAuthSession> {
  try {
    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList,
    })
    return session
  } catch {
    return null
  }
}

/**
 * Get the current user with full database details
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getCurrentSession()
  if (!session?.user?.id) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })

  return user
}

/**
 * Check if the current user is an admin
 * Admins are identified by:
 * 1. isAdmin flag in database
 * 2. ADMIN_EMAIL environment variable match
 */
export async function verifyAdmin(): Promise<User | null> {
  const user = await getCurrentUser()
  if (!user) {
    return null
  }

  // Check if user is admin via flag
  if (user.isAdmin) {
    return user
  }

  // Check if user email matches ADMIN_EMAIL env variable
  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail && user.email.toLowerCase() === adminEmail.toLowerCase()) {
    // Auto-grant admin rights if email matches
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isAdmin: true }
    })
    return updatedUser
  }

  return null
}

/**
 * Require admin access - throws if not admin
 * Use in Server Components and Server Actions
 */
export async function requireAdmin(): Promise<User> {
  const admin = await verifyAdmin()
  if (!admin) {
    throw new Error('Unauthorized: Admin access required')
  }
  return admin
}

/**
 * Require authenticated user - throws if not logged in
 * Use in Server Components and Server Actions
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized: Authentication required')
  }
  return user
}

/**
 * Check subscription status
 * Returns true if user has active subscription or is in trial period
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { stripeSubscription: true }
  })

  if (!user) return false

  // Check Stripe subscription status
  if (user.stripeSubscription) {
    return ['active', 'trialing'].includes(user.stripeSubscription.status)
  }

  // Check trial status
  if (user.subscriptionTier === 'trial' && user.trialEndDate) {
    return new Date() < user.trialEndDate
  }

  return false
}

/**
 * Check if trial has expired
 */
export async function isTrialExpired(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { stripeSubscription: true }
  })

  if (!user) return true

  // If they have a Stripe subscription, trial status doesn't matter
  if (user.stripeSubscription) {
    return false
  }

  // Check trial end date
  if (user.subscriptionTier === 'trial' && user.trialEndDate) {
    return new Date() >= user.trialEndDate
  }

  // No trial set up = expired
  return true
}
