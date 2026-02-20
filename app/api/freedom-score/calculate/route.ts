import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authorizeAndGetUserId, unauthorizedResponse } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

interface FreedomScoreInput {
  runwayMonths: number
  hoursWorked: number
  sleepAvg: number
  aiPrsMerged: number
  automationHours: number
}

interface FreedomScoreResult {
  overall: number
  financial: number
  time: number
  health: number
  systems: number
  trend: number
}

/**
 * Calculate freedom score based on metrics
 * 
 * Weights:
 * - Financial (runway): 40%
 * - Time (work/life): 30%
 * - Health (sleep): 20%
 * - Systems (automation): 10%
 */
function calculateFreedomScore(metrics: FreedomScoreInput): FreedomScoreResult {
  // Financial: runway months / 12 * 100, capped at 100
  const financial = Math.min(100, (metrics.runwayMonths / 12) * 100)
  
  // Time: optimal is 40 hours, lose 5 points per hour deviation
  const time = Math.max(0, 100 - Math.abs(metrics.hoursWorked - 40) * 5)
  
  // Health: sleep avg / 8 * 100 (8 hours = 100 points)
  const health = (metrics.sleepAvg / 8) * 100
  
  // Systems: 10 pts per PR merged + 2 pts per automation hour, cap at 100
  const systems = Math.min(100, metrics.aiPrsMerged * 10 + metrics.automationHours * 2)
  
  // Weighted composite
  const overall = Math.round(
    financial * 0.40 +
    time * 0.30 +
    health * 0.20 +
    systems * 0.10
  )
  
  return {
    overall,
    financial: Math.round(financial),
    time: Math.round(time),
    health: Math.round(health),
    systems: Math.round(systems),
    trend: 0 // Will be calculated based on previous score
  }
}

/**
 * POST /api/freedom-score/calculate
 * Calculate and store new freedom score
 */
export async function POST(request: NextRequest) {
  const userId = await authorizeAndGetUserId(request)
  if (!userId) {
    return unauthorizedResponse()
  }

  try {
    // Get user's profile for manual metrics
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentRunway: true,
        sleepTarget: true,
        deepWorkHours: true,
      }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Get request body (can override defaults)
    const body = await request.json().catch(() => ({}))

    // Prepare metrics (with fallbacks from profile)
    const metrics: FreedomScoreInput = {
      runwayMonths: body.runwayMonths ?? profile.currentRunway ?? 0,
      hoursWorked: body.hoursWorked ?? 45, // Default assumption if not provided
      sleepAvg: body.sleepAvg ?? profile.sleepTarget ?? 7,
      aiPrsMerged: body.aiPrsMerged ?? 0,
      automationHours: body.automationHours ?? 0,
    }

    // Calculate score
    const score = calculateFreedomScore(metrics)

    // Get previous score for trend calculation
    const previousScore = await prisma.freedomScore.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    if (previousScore) {
      score.trend = score.overall - previousScore.overall
    }

    // Store new score
    const freedomScore = await prisma.freedomScore.create({
      data: {
        userId,
        overall: score.overall,
        financial: score.financial,
        time: score.time,
        health: score.health,
        systems: score.systems,
        trend: score.trend,
        runwayMonths: metrics.runwayMonths,
        hoursWorked: metrics.hoursWorked,
        sleepAvg: metrics.sleepAvg,
        aiPrsMerged: metrics.aiPrsMerged,
        automationHours: metrics.automationHours,
      }
    })

    return NextResponse.json(freedomScore)
  } catch (error) {
    console.error('Error calculating freedom score:', error)
    return NextResponse.json(
      { error: 'Failed to calculate freedom score' },
      { status: 500 }
    )
  }
}
