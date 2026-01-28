import { NextRequest } from 'next/server'

/**
 * Validates the API token from the request headers
 * Token should be passed as: Authorization: Bearer <token>
 */
export function validateApiToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader) {
    return false
  }
  
  const [type, token] = authHeader.split(' ')
  
  if (type !== 'Bearer' || !token) {
    return false
  }
  
  const validToken = process.env.API_TOKEN
  
  if (!validToken) {
    console.error('API_TOKEN not configured in environment')
    return false
  }
  
  return token === validToken
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
