import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { authorizeAndGetUserId, unauthorizedResponse } from '../../../lib/api-auth'
import { embedTask } from '../../../lib/embeddings'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/tasks
 * Fetch all tasks, optionally filtered by status and source
 * Query params: ?status=IN_PROGRESS|BACKLOG|COMPLETED|BLOCKED&source=agent-name
 */
export async function GET(request: NextRequest) {
  const userId = await authorizeAndGetUserId(request)
  if (!userId) {
    return unauthorizedResponse()
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const source = searchParams.get('source')

    const where: Record<string, unknown> = { userId } // Multi-tenant filter
    if (status) {
      where.status = status
    }
    if (source) {
      where.source = source
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            avatar: true,
            image: true,
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          }
        },
        labels: {
          include: {
            label: true
          }
        },
        subtasks: {
          orderBy: { position: 'asc' }
        }
      },
      orderBy: [
        { position: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })
    
    // Group by status for convenience
    const grouped = {
      recurring: tasks.filter(t => t.status === 'RECURRING'),
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS'),
      backlog: tasks.filter(t => t.status === 'BACKLOG'),
      review: tasks.filter(t => t.status === 'REVIEW'),
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
  const userId = await authorizeAndGetUserId(request)
  if (!userId) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()

    // Check for X-Agent-Source header as alternative to body field
    const headerSource = request.headers.get('X-Agent-Source')
    const source = headerSource || body.source || null

    // Check for duplicate task with same title + source + status
    const existingTask = await prisma.task.findFirst({
      where: {
        userId,
        title: body.title,
        source,
        status: body.status || 'BACKLOG',
      }
    })

    if (existingTask) {
      return NextResponse.json(
        { 
          error: 'Duplicate task',
          message: `A task with title "${body.title}" already exists for this agent`,
          existingTaskId: existingTask.id
        },
        { status: 409 }
      )
    }

    // Get max position for the target status
    const maxPos = await prisma.task.aggregate({
      where: { status: body.status || 'BACKLOG', userId },
      _max: { position: true }
    })
    
    // Auto-set dates based on status
    const status = body.status || 'BACKLOG'
    let completedAt = body.completedAt ? new Date(body.completedAt) : null
    let startedAt = body.startedAt ? new Date(body.startedAt) : null
    
    // Auto-set completedAt when creating as COMPLETED
    if (status === 'COMPLETED' && !completedAt) {
      completedAt = new Date()
    }
    // Auto-set startedAt when creating as IN_PROGRESS
    if (status === 'IN_PROGRESS' && !startedAt) {
      startedAt = new Date()
    }
    
    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description,
        status,
        priority: body.priority || 'MEDIUM',
        isRecurring: body.isRecurring || false,
        position: (maxPos._max.position || 0) + 1,
        userId, // Multi-tenant: assign to current user
        source, // Agent source for separation
        assigneeId: body.assigneeId,
        projectId: body.projectId,
        startedAt,
        statusNote: body.statusNote,
        completedAt,
        outcome: body.outcome,
        blocker: body.blocker,
        need: body.need,
        notes: body.notes,
        dueDate: body.dueDate ? new Date(body.dueDate) : null
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            avatar: true,
            image: true,
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          }
        },
        labels: {
          include: {
            label: true
          }
        },
        subtasks: {
          orderBy: { position: 'asc' }
        }
      }
    })
    
    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'created',
        details: JSON.stringify({ title: task.title, status: task.status, source: task.source }),
        taskId: task.id,
      }
    })
    
    // Generate embedding async (don't block response)
    embedTask(task).catch(err => console.error('Embedding failed:', err))
    
    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
