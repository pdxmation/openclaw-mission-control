'use server'

import { randomBytes, createHash } from 'crypto'
import { prisma } from '../prisma'
import { requireUser } from '../admin/auth'
import type { ApiKey } from '../../generated/prisma/client'

export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

const API_KEY_PREFIX = 'mc_'

/**
 * Generate a new API key
 */
function generateApiKey(): { key: string; prefix: string; hash: string } {
  const bytes = randomBytes(32)
  const key = `${API_KEY_PREFIX}${bytes.toString('hex')}`
  const prefix = key.slice(0, 12)
  const hash = createHash('sha256').update(key).digest('hex')

  return { key, prefix, hash }
}

/**
 * Get all API keys for the current user
 */
export async function getApiKeys(): Promise<ActionResult<ApiKey[]>> {
  try {
    const user = await requireUser()

    const keys = await prisma.apiKey.findMany({
      where: {
        userId: user.id,
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, data: keys }
  } catch (error) {
    console.error('Error fetching API keys:', error)
    return { success: false, error: 'Failed to fetch API keys' }
  }
}

/**
 * Create a new API key
 */
export async function createApiKey(
  name: string
): Promise<ActionResult<{ id: string; key: string }>> {
  try {
    const user = await requireUser()

    // Check active key limit (max 5)
    const activeCount = await prisma.apiKey.count({
      where: {
        userId: user.id,
        revokedAt: null,
      },
    })

    if (activeCount >= 5) {
      return { success: false, error: 'Maximum of 5 active API keys allowed' }
    }

    const { key, prefix, hash } = generateApiKey()

    const apiKey = await prisma.apiKey.create({
      data: {
        userId: user.id,
        name: name || 'Default',
        keyPrefix: prefix,
        keyHash: hash,
      },
    })

    // Return the full key only once - we only store the hash
    return {
      success: true,
      data: { id: apiKey.id, key },
    }
  } catch (error) {
    console.error('Error creating API key:', error)
    return { success: false, error: 'Failed to create API key' }
  }
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser()

    const key = await prisma.apiKey.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!key) {
      return { success: false, error: 'API key not found' }
    }

    if (key.revokedAt) {
      return { success: false, error: 'API key is already revoked' }
    }

    await prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    })

    return { success: true }
  } catch (error) {
    console.error('Error revoking API key:', error)
    return { success: false, error: 'Failed to revoke API key' }
  }
}

/**
 * Validate an API key and return the user ID
 * Used by API routes for authentication
 */
export async function validateApiKey(key: string): Promise<string | null> {
  try {
    if (!key.startsWith(API_KEY_PREFIX)) {
      return null
    }

    const hash = createHash('sha256').update(key).digest('hex')

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        keyHash: hash,
        revokedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    })

    if (!apiKey) {
      return null
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })

    return apiKey.userId
  } catch (error) {
    console.error('Error validating API key:', error)
    return null
  }
}
