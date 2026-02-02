import { randomUUID } from 'crypto'

/**
 * Generate a secure approval token
 */
export function generateApprovalToken(): string {
  return randomUUID()
}

/**
 * Calculate token expiration date (7 days from now)
 */
export function getTokenExpirationDate(): Date {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)
  return expiresAt
}

/**
 * Check if a token has expired
 */
export function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true
  return new Date() > expiresAt
}
