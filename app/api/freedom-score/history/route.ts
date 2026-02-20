import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authorizeAndGetUserId, unauthorizedResponse } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/freedom-score/history
 * Get last 12 weeks of freedom scores
 */
export async function GET(request: NextRequest) {
  const userId = await authorizeAndGetUserId(request)
  if (!userId) {
    return unauthorizedResponse()
  }

  try {
    const scores = await prisma.freedomScore.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 12,
    })

    return NextResponse.json(scores)
  } catch (error) {
    console.error('Error fetching freedom score history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}
