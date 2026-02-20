import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authorizeAndGetUserId, unauthorizedResponse } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/freedom-score/report
 * Generate weekly report with interpretation
 */
export async function GET(request: NextRequest) {
  const userId = await authorizeAndGetUserId(request)
  if (!userId) {
    return unauthorizedResponse()
  }

  try {
    // Get current score
    const currentScore = await prisma.freedomScore.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    if (!currentScore) {
      return NextResponse.json(
        { error: 'No freedom score calculated yet' },
        { status: 404 }
      )
    }

    // Get previous score for comparison
    const previousScores = await prisma.freedomScore.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: 1,
      take: 1,
    })
    const previousScore = previousScores[0]

    // Get completed tasks from this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const wins = await prisma.task.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        completedAt: {
          gte: oneWeekAgo,
        },
      },
      orderBy: { completedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        outcome: true,
      },
    })

    // Interpret overall score
    function getScoreLabel(score: number): string {
      if (score >= 90) return 'Fully Free'
      if (score >= 70) return 'Building Freedom'
      if (score >= 50) return 'Surviving'
      if (score >= 30) return 'Chaos Zone'
      return 'Emergency'
    }

    // Generate focus areas based on scores
    const focusAreas: string[] = []
    if (currentScore.time < 70) {
      const excessHours = Math.round((100 - currentScore.time) / 5)
      focusAreas.push(`Reduce hours worked by ${excessHours} this week`)
    }
    if (currentScore.health < 70) {
      const sleepGap = Math.round((8 - (currentScore.health / 100 * 8)) * 10) / 10
      focusAreas.push(`Add ${sleepGap} hours of sleep per night`)
    }
    if (currentScore.systems < 50) {
      focusAreas.push('Look for one more automation opportunity')
    }
    if (currentScore.financial < 50) {
      focusAreas.push('Focus on revenue-generating activities')
    }

    const report = {
      score: currentScore,
      previousScore: previousScore || null,
      label: getScoreLabel(currentScore.overall),
      wins: wins.map(w => w.outcome || w.title).filter(Boolean),
      focusAreas: focusAreas.length > 0 ? focusAreas : ['Keep up the great momentum!'],
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error generating freedom score report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
