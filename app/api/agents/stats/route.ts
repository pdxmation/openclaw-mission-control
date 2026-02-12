import { NextRequest, NextResponse } from 'next/server'
import { authorizeAndGetUserId, unauthorizedResponse } from '@/lib/api-auth'
import { fetchAgentStats } from '@/lib/agents'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/agents/stats
 * Fetch agent statistics including task counts and status
 */
export async function GET(request: NextRequest) {
  const userId = await authorizeAndGetUserId(request)
  if (!userId) {
    return unauthorizedResponse()
  }

  try {
    const agents = await fetchAgentStats(userId)
    
    return NextResponse.json({
      agents,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching agent stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent stats' },
      { status: 500 }
    )
  }
}
