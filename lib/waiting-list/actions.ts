'use server'

import { prisma } from '../prisma'
import { requireAdmin } from '../admin/auth'
import {
  waitingListSubmitSchema,
  type WaitingListSubmitInput,
} from './schemas'
import { generateApprovalToken, getTokenExpirationDate, isTokenExpired } from './token'
import { sendApprovalEmail, sendRejectionEmail } from './email'
import type { WaitingList, WaitingListStatus } from '../../generated/prisma/client'

export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Submit a waitlist application (public)
 */
export async function submitWaitingListApplication(
  input: WaitingListSubmitInput
): Promise<ActionResult<{ id: string }>> {
  try {
    // Validate input
    const validated = waitingListSubmitSchema.parse(input)

    // Check if email already exists
    const existing = await prisma.waitingList.findUnique({
      where: { email: validated.email }
    })

    if (existing) {
      if (existing.status === 'approved') {
        return { success: false, error: 'This email has already been approved. Check your inbox for the signup link.' }
      }
      if (existing.status === 'pending') {
        return { success: false, error: 'This email is already on the waitlist.' }
      }
      // If rejected, allow re-application
    }

    // Create or update entry
    const entry = await prisma.waitingList.upsert({
      where: { email: validated.email },
      update: {
        name: validated.name,
        company: validated.company || null,
        useCase: validated.useCase || null,
        status: 'pending',
        approvalToken: null,
        tokenExpiresAt: null,
      },
      create: {
        email: validated.email,
        name: validated.name,
        company: validated.company || null,
        useCase: validated.useCase || null,
        status: 'pending',
      }
    })

    return { success: true, data: { id: entry.id } }
  } catch (error) {
    console.error('Error submitting waitlist application:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to submit application' }
  }
}

/**
 * Validate an approval token (for signup page)
 */
export async function validateApprovalToken(
  token: string
): Promise<ActionResult<{ email: string; name: string }>> {
  try {
    const entry = await prisma.waitingList.findUnique({
      where: { approvalToken: token }
    })

    if (!entry) {
      return { success: false, error: 'Invalid token' }
    }

    if (entry.status !== 'approved') {
      return { success: false, error: 'Token is no longer valid' }
    }

    if (isTokenExpired(entry.tokenExpiresAt)) {
      return { success: false, error: 'Token has expired. Please contact support.' }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: entry.email }
    })

    if (existingUser) {
      return { success: false, error: 'An account with this email already exists. Please log in.' }
    }

    return {
      success: true,
      data: { email: entry.email, name: entry.name }
    }
  } catch (error) {
    console.error('Error validating approval token:', error)
    return { success: false, error: 'Failed to validate token' }
  }
}

/**
 * Mark token as used after successful signup
 */
export async function markTokenAsUsed(token: string): Promise<void> {
  await prisma.waitingList.update({
    where: { approvalToken: token },
    data: {
      approvalToken: null,
      tokenExpiresAt: null,
    }
  })
}

/**
 * Get waitlist entries (admin only)
 */
export async function getWaitingListEntries(filters?: {
  status?: WaitingListStatus
  search?: string
  limit?: number
  offset?: number
}): Promise<ActionResult<{ entries: WaitingList[]; total: number }>> {
  try {
    await requireAdmin()

    const where: Record<string, unknown> = {}

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
        { company: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const [entries, total] = await Promise.all([
      prisma.waitingList.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      prisma.waitingList.count({ where }),
    ])

    return { success: true, data: { entries, total } }
  } catch (error) {
    console.error('Error fetching waitlist entries:', error)
    return { success: false, error: 'Failed to fetch waitlist entries' }
  }
}

/**
 * Approve a waitlist entry (admin only)
 */
export async function approveWaitingListEntry(id: string): Promise<ActionResult> {
  try {
    await requireAdmin()

    const entry = await prisma.waitingList.findUnique({
      where: { id }
    })

    if (!entry) {
      return { success: false, error: 'Entry not found' }
    }

    if (entry.status === 'approved') {
      return { success: false, error: 'Entry is already approved' }
    }

    // Generate approval token
    const token = generateApprovalToken()
    const expiresAt = getTokenExpirationDate()

    // Update entry
    await prisma.waitingList.update({
      where: { id },
      data: {
        status: 'approved',
        approvalToken: token,
        tokenExpiresAt: expiresAt,
      }
    })

    // Send approval email
    const emailSent = await sendApprovalEmail({
      email: entry.email,
      name: entry.name,
      token,
    })

    if (!emailSent) {
      console.warn(`Failed to send approval email to ${entry.email}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Error approving waitlist entry:', error)
    return { success: false, error: 'Failed to approve entry' }
  }
}

/**
 * Reject a waitlist entry (admin only)
 */
export async function rejectWaitingListEntry(id: string): Promise<ActionResult> {
  try {
    await requireAdmin()

    const entry = await prisma.waitingList.findUnique({
      where: { id }
    })

    if (!entry) {
      return { success: false, error: 'Entry not found' }
    }

    if (entry.status === 'rejected') {
      return { success: false, error: 'Entry is already rejected' }
    }

    // Update entry
    await prisma.waitingList.update({
      where: { id },
      data: {
        status: 'rejected',
        approvalToken: null,
        tokenExpiresAt: null,
      }
    })

    // Send rejection email
    const emailSent = await sendRejectionEmail({
      email: entry.email,
      name: entry.name,
    })

    if (!emailSent) {
      console.warn(`Failed to send rejection email to ${entry.email}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Error rejecting waitlist entry:', error)
    return { success: false, error: 'Failed to reject entry' }
  }
}

/**
 * Bulk approve waitlist entries (admin only)
 */
export async function bulkApproveEntries(ids: string[]): Promise<ActionResult<{ approved: number; failed: number }>> {
  try {
    await requireAdmin()

    let approved = 0
    let failed = 0

    for (const id of ids) {
      const result = await approveWaitingListEntry(id)
      if (result.success) {
        approved++
      } else {
        failed++
      }
    }

    return {
      success: true,
      data: { approved, failed }
    }
  } catch (error) {
    console.error('Error bulk approving entries:', error)
    return { success: false, error: 'Failed to bulk approve entries' }
  }
}

/**
 * Resend approval email (admin only)
 */
export async function resendApprovalEmail(id: string): Promise<ActionResult> {
  try {
    await requireAdmin()

    const entry = await prisma.waitingList.findUnique({
      where: { id }
    })

    if (!entry) {
      return { success: false, error: 'Entry not found' }
    }

    if (entry.status !== 'approved') {
      return { success: false, error: 'Entry must be approved first' }
    }

    // Generate new token if expired or missing
    let token = entry.approvalToken
    if (!token || isTokenExpired(entry.tokenExpiresAt)) {
      token = generateApprovalToken()
      const expiresAt = getTokenExpirationDate()

      await prisma.waitingList.update({
        where: { id },
        data: {
          approvalToken: token,
          tokenExpiresAt: expiresAt,
        }
      })
    }

    // Send email
    const emailSent = await sendApprovalEmail({
      email: entry.email,
      name: entry.name,
      token,
    })

    if (!emailSent) {
      return { success: false, error: 'Failed to send email' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error resending approval email:', error)
    return { success: false, error: 'Failed to resend email' }
  }
}

/**
 * Get waitlist statistics (admin only)
 */
export async function getWaitingListStats(): Promise<ActionResult<{
  total: number
  pending: number
  approved: number
  rejected: number
}>> {
  try {
    await requireAdmin()

    const [total, pending, approved, rejected] = await Promise.all([
      prisma.waitingList.count(),
      prisma.waitingList.count({ where: { status: 'pending' } }),
      prisma.waitingList.count({ where: { status: 'approved' } }),
      prisma.waitingList.count({ where: { status: 'rejected' } }),
    ])

    return {
      success: true,
      data: { total, pending, approved, rejected }
    }
  } catch (error) {
    console.error('Error fetching waitlist stats:', error)
    return { success: false, error: 'Failed to fetch stats' }
  }
}
