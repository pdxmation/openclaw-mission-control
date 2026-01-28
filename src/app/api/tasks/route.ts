import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { validateApiToken, unauthorizedResponse } from '../../../lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/tasks
 * Fetch all tasks, optionally filtered by status
 * Query params: ?status=IN_PROGRESS|BACKLOG|COMPLETED|BLOCKED
 */
export async function GET(request: NextRequest) {
  if (!validateApiToken(request)) {
    return unauthorizedResponse()
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    const where = status ? { status: status as any } : {}
    
    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })
    
    // Group by status for convenience
    const grouped = {
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS'),
      backlog: tasks.filter(t => t.status === 'BACKLOG'),
      completed: tasks.filter(t => t.status === 'COMPLETED'),
      blocked: tasks.filter(t => t.status === 'BLOCKED'),
      all: tasks
    }
    
    return NextResponse.json(grouped)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tasks
 * Create a new task
 */
export async function POST(request: NextRequest) {
  if (!validateApiToken(request)) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    
    const task = await prisma.task.create({
      data: {
        title: body.title,
        status: body.status || 'BACKLOG',
        priority: body.priority || 'MEDIUM',
        startedAt: body.startedAt ? new Date(body.startedAt) : null,
        statusNote: body.statusNote,
        completedAt: body.completedAt ? new Date(body.completedAt) : null,
        outcome: body.outcome,
        blocker: body.blocker,
        need: body.need,
        notes: body.notes
      }
    })
    
    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
