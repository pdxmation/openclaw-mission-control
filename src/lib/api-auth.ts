import { NextRequest } from 'next/server'
import { auth } from './auth'

/**
 * Validates the API token from the request headers
 * Token should be passed as: Authorization: Bearer <token>
 */
export function validateApiToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader) return false

  const [type, token] = authHeader.split(' ')

  if (type !== 'Bearer' || !token) return false

  const validToken = process.env.API_TOKEN

  if (!validToken) {
    console.error('API_TOKEN not configured in environment')
    return false
  }

  return token === validToken
}

/**
 * Validates the Better Auth session cookie using Better Auth's API.
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
