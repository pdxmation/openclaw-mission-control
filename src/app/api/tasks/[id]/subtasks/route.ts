import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { validateApiToken, unauthorizedResponse } from '../../../../../lib/api-auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Check if request is from internal UI (no auth needed) or external API (auth required)
function isInternalRequest(request: NextRequest): boolean {
  const referer = request.headers.get('referer') || ''
  const origin = request.headers.get('origin') || ''
  return referer.includes(process.env.BETTER_AUTH_URL || '') || 
         origin.includes(process.env.BETTER_AUTH_URL || '') ||
         referer.includes('localhost') ||
         origin.includes('localhost') ||
         !request.headers.get('authorization')
}

/**
 * GET /api/tasks/[id]/subtasks
 * List all subtasks for a task
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!isInternalRequest(request) && !validateApiToken(request)) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    
    const subtasks = await prisma.subtask.findMany({
      where: { taskId: id },
      orderBy: { position: 'asc' }
    })
    
    return NextResponse.json(subtasks)
  } catch (error) {
    console.error('Error fetching subtasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subtasks' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tasks/[id]/subtasks
 * Create a new subtask for a task
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isInternalRequest(request) && !validateApiToken(request)) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    const body = await request.json()
    
    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }
    
    // Verify task exists
    const task = await prisma.task.findUnique({ where: { id } })
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }
    
    // Get max position for this task's subtasks
    const maxPos = await prisma.subtask.aggregate({
      where: { taskId: id },
      _max: { position: true }
    })
    
    const subtask = await prisma.subtask.create({
      data: {
        title: body.title.trim(),
        completed: body.completed || false,
        position: (maxPos._max.position ?? -1) + 1,
        taskId: id
      }
    })
    
    return NextResponse.json(subtask, { status: 201 })
  } catch (error) {
    console.error('Error creating subtask:', error)
    return NextResponse.json(
      { error: 'Failed to create subtask' },
      { status: 500 }
    )
  }
}
