import { NextRequest } from 'next/server'
import { auth } from './auth'
import { validateApiKey } from './api-keys/actions'

/**
 * Get user ID from API key
 */
async function getUserIdFromApiKey(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return null

  const [type, token] = authHeader.split(' ')
  if (type !== 'Bearer' || !token) return null

  // Check if it's a user API key (starts with mc_)
  if (token.startsWith('mc_')) {
    return validateApiKey(token)
  }

  // Legacy: Check global API token
  const validToken = process.env.API_TOKEN
  if (validToken && token === validToken) {
    // For legacy token, return a placeholder or first admin user ID
    return 'legacy-api-token'
  }

  return null
}

/**
 * Get user ID from session cookie
 */
async function getUserIdFromSession(request: NextRequest): Promise<string | null> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    return session?.user?.id || null
  } catch {
    return null
  }
}

/**
 * Authorize request and return user ID
 * Returns user ID if authorized, null otherwise
 */
export async function authorizeAndGetUserId(request: NextRequest): Promise<string | null> {
  // Check API key first
  const apiKeyUserId = await getUserIdFromApiKey(request)
  if (apiKeyUserId && apiKeyUserId !== 'legacy-api-token') {
    return apiKeyUserId
  }

  // Check session
  const sessionUserId = await getUserIdFromSession(request)
  if (sessionUserId) {
    return sessionUserId
  }

  // Legacy API token support - return null to indicate legacy mode
  // The calling route can decide how to handle this
  if (apiKeyUserId === 'legacy-api-token') {
    return null // Will need special handling in routes
  }

  return null
}

/**
 * Validates the API token from the request headers
 * Token should be passed as: Authorization: Bearer <token>
 * @deprecated Use authorizeAndGetUserId instead
 */
export function validateApiToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader) return false

  const [type, token] = authHeader.split(' ')

  if (type !== 'Bearer' || !token) return false

  // Check for user API key
  if (token.startsWith('mc_')) {
    return true // Will be validated in authorizeAndGetUserId
  }

  const validToken = process.env.API_TOKEN

  if (!validToken) {
    console.error('API_TOKEN not configured in environment')
    return false
  }

  return token === validToken
}

/**
 * Validates the Better Auth session cookie using Better Auth's API.
 * @deprecated Use authorizeAndGetUserId instead
 */
export async function validateSessionCookie(request: NextRequest): Promise<boolean> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    return session !== null
  } catch {
    return false
  }
}

/**
 * Authorize either via API token or session cookie.
 * @deprecated Use authorizeAndGetUserId instead
 */
export async function authorizeRequest(request: NextRequest): Promise<boolean> {
  if (validateApiToken(request)) return true
  if (await validateSessionCookie(request)) return true
  return false
}

/**
 * Returns an unauthorized response
 */
export function unauthorizedResponse() {
  return Response.json(
    { error: 'Unauthorized', message: 'Invalid or missing API token' },
    { status: 401 }
  )
}
