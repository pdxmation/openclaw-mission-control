import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { validateApiToken, unauthorizedResponse } from '../../../lib/api-auth'
import { embedTask } from '../../../lib/embeddings'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Check if request is from internal UI (no auth needed) or external API (auth required)
function isInternalRequest(request: NextRequest): boolean {
  const referer = request.headers.get('referer') || ''
  const origin = request.headers.get('origin') || ''
  // Allow requests from same origin (internal UI)
  return referer.includes(process.env.BETTER_AUTH_URL || '') || 
         origin.includes(process.env.BETTER_AUTH_URL || '') ||
         referer.includes('localhost') ||
         origin.includes('localhost') ||
         !request.headers.get('authorization') // No auth header = likely internal fetch
}

/**
 * GET /api/tasks
 * Fetch all tasks, optionally filtered by status
 * Query params: ?status=IN_PROGRESS|BACKLOG|COMPLETED|BLOCKED
 */
export async function GET(request: NextRequest) {
  // For external API calls, require auth
  if (!isInternalRequest(request) && !validateApiToken(request)) {
    return unauthorizedResponse()
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    const where = status ? { status: status as any } : {}
    
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
  // For external API calls, require auth
  if (!isInternalRequest(request) && !validateApiToken(request)) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    
    // Get max position for the target status
    const maxPos = await prisma.task.aggregate({
      where: { status: body.status || 'BACKLOG' },
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
        details: JSON.stringify({ title: task.title, status: task.status }),
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
