import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authorizeAndGetUserId, unauthorizedResponse } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/freedom-score
 * Get current week's freedom score
 */
export async function GET(request: NextRequest) {
  const userId = await authorizeAndGetUserId(request)
  if (!userId) {
    return unauthorizedResponse()
  }

  try {
    // Get most recent score
    const score = await prisma.freedomScore.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    if (!score) {
      return NextResponse.json(
        { error: 'No freedom score calculated yet' },
        { status: 404 }
      )
    }

    return NextResponse.json(score)
  } catch (error) {
    console.error('Error fetching freedom score:', error)
    return NextResponse.json(
      { error: 'Failed to fetch freedom score' },
      { status: 500 }
    )
  }
}
