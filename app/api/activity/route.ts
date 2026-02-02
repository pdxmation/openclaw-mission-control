import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { authorizeAndGetUserId, unauthorizedResponse } from '../../../lib/api-auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/activity
 * Fetch recent activity logs
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

    // Multi-tenant filter: only show activity for user's tasks
    const activities = await prisma.activityLog.findMany({
      where: {
        task: {
          userId, // Only activities for tasks owned by this user
        }
      },
      take: Math.min(limit, 100), // Max 100
      orderBy: { createdAt: 'desc' },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            image: true,
          }
        }
      }
    })
    
    return NextResponse.json(activities)
  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}
