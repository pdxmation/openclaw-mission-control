import { NextRequest, NextResponse } from 'next/server'
import { authorizeAndGetUserId, unauthorizedResponse } from '@/lib/api-auth'
import { fetchAgentWeeklyStats } from '@/lib/agents'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/agents/weekly-stats
 * Fetch 7-day completion stats for each agent
 */
export async function GET(request: NextRequest) {
  const userId = await authorizeAndGetUserId(request)
  if (!userId) {
    return unauthorizedResponse()
  }

  try {
    const weeklyStats = await fetchAgentWeeklyStats(userId)
    
    return NextResponse.json({
      weeklyStats,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching agent weekly stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent weekly stats' },
      { status: 500 }
    )
  }
}
