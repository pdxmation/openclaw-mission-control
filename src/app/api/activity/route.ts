import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/activity
 * Fetch recent activity logs
 * Query params: ?limit=20
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    
    const activities = await prisma.activityLog.findMany({
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
