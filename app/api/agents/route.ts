import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { authorizeAndGetUserId, unauthorizedResponse } from '../../../lib/api-auth'
import { createApiKey } from '../../../lib/api-keys/actions'

export const dynamic = 'force-dynamic'

/**
 * POST /api/agents
 * Self-registration for Agents: Creates an API key for the user
 * This allows an agent to "register" and get a token if it doesn't have one,
 * or allows an admin to create keys for agents.
 * 
 * Body: { name: string }
 */
export async function POST(request: NextRequest) {
  // We need a session to register an agent (usually done via web UI)
  const userId = await authorizeAndGetUserId(request)
  if (!userId) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const name = body.name || 'Registered Agent'

    const result = await createApiKey(name)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to register agent' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      agentName: name,
      apiKey: result.data?.key,
      message: 'Agent registered successfully. Store this API key securely as it will not be shown again.'
    }, { status: 201 })
  } catch (error) {
    console.error('Error registering agent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
