import { NextRequest, NextResponse } from 'next/server'
import { authorizeAndGetUserId, unauthorizedResponse } from '@/lib/api-auth'
import { fetchAgentActivity } from '@/lib/agents'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/agents/activity
 * Fetch recent agent activity
 * Query params: ?limit=20
 */
export async function GET(request: NextRequest) {
  const userId = await authorizeAndGetUserId(request)
  if (!userId) {
    return unauthorizedResponse()
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const activities = await fetchAgentActivity(userId, Math.min(limit, 100))
    
    return NextResponse.json({
      activities,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching agent activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent activity' },
      { status: 500 }
    )
  }
}
