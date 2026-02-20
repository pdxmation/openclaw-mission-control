import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { authorizeAndGetUserId, unauthorizedResponse } from '../../../../lib/api-auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const profileSelect = {
  id: true,
  name: true,
  email: true,
  telegram: true,
  github: true,
  timezone: true,
  wakeTime: true,
  location: true,
  communicationStyle: true,
  workStartTime: true,
  workEndTime: true,
  preferences: true,
  shortTermGoals: true,
  mediumTermGoals: true,
  longTermGoals: true,
  techStack: true,
  currentFocus: true,
  myMission: true,
  notes: true,
  // Personal
  children: true,
  partner: true,
  pets: true,
  hobbies: true,
  // Health
  exerciseRoutine: true,
  sleepTarget: true,
  healthFocus: true,
  // Business
  monthlyRevenueTarget: true,
  currentRunway: true,
  teamSize: true,
  keyMetrics: true,
  // Productivity
  preferredAsyncTools: true,
  decisionFatigueTriggers: true,
  deepWorkHours: true,
  createdAt: true,
  updatedAt: true,
}

/**
 * GET /api/user/profile
 * Get current user profile
 */
export async function GET(request: NextRequest) {
  const userId = await authorizeAndGetUserId(request)
  if (!userId) {
    return unauthorizedResponse()
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: profileSelect,
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/user/profile
 * Update profile
 */
export async function PATCH(request: NextRequest) {
  const userId = await authorizeAndGetUserId(request)
  if (!userId) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()

    const updateData: Record<string, unknown> = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.email !== undefined) updateData.email = body.email
    if (body.telegram !== undefined) updateData.telegram = body.telegram
    if (body.github !== undefined) updateData.github = body.github
    if (body.timezone !== undefined) updateData.timezone = body.timezone
    if (body.wakeTime !== undefined) updateData.wakeTime = body.wakeTime
    if (body.location !== undefined) updateData.location = body.location
    if (body.communicationStyle !== undefined) updateData.communicationStyle = body.communicationStyle
    if (body.workStartTime !== undefined) updateData.workStartTime = body.workStartTime
    if (body.workEndTime !== undefined) updateData.workEndTime = body.workEndTime
    if (body.preferences !== undefined) updateData.preferences = body.preferences
    if (body.shortTermGoals !== undefined) updateData.shortTermGoals = body.shortTermGoals
    if (body.mediumTermGoals !== undefined) updateData.mediumTermGoals = body.mediumTermGoals
    if (body.longTermGoals !== undefined) updateData.longTermGoals = body.longTermGoals
    if (body.techStack !== undefined) updateData.techStack = body.techStack
    if (body.currentFocus !== undefined) updateData.currentFocus = body.currentFocus
    if (body.myMission !== undefined) updateData.myMission = body.myMission
    if (body.notes !== undefined) updateData.notes = body.notes

    // Personal
    if (body.children !== undefined) updateData.children = body.children
    if (body.partner !== undefined) updateData.partner = body.partner
    if (body.pets !== undefined) updateData.pets = body.pets
    if (body.hobbies !== undefined) updateData.hobbies = body.hobbies

    // Health
    if (body.exerciseRoutine !== undefined) updateData.exerciseRoutine = body.exerciseRoutine
    if (body.sleepTarget !== undefined) updateData.sleepTarget = body.sleepTarget
    if (body.healthFocus !== undefined) updateData.healthFocus = body.healthFocus

    // Business
    if (body.monthlyRevenueTarget !== undefined) updateData.monthlyRevenueTarget = body.monthlyRevenueTarget
    if (body.currentRunway !== undefined) updateData.currentRunway = body.currentRunway
    if (body.teamSize !== undefined) updateData.teamSize = body.teamSize
    if (body.keyMetrics !== undefined) updateData.keyMetrics = body.keyMetrics

    // Productivity
    if (body.preferredAsyncTools !== undefined) updateData.preferredAsyncTools = body.preferredAsyncTools
    if (body.decisionFatigueTriggers !== undefined) updateData.decisionFatigueTriggers = body.decisionFatigueTriggers
    if (body.deepWorkHours !== undefined) updateData.deepWorkHours = body.deepWorkHours

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: profileSelect,
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating profile:', error)
    const errorCode = typeof error === 'object' && error && 'code' in error ? (error as { code: string }).code : undefined
    if (errorCode === 'P2002') {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
