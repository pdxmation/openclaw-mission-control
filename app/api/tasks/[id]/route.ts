import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { authorizeAndGetUserId, unauthorizedResponse } from '../../../../lib/api-auth'
import { embedTask, deleteTaskEmbedding } from '../../../../lib/embeddings'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/tasks/[id]
 * Fetch a single task by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const userId = await authorizeAndGetUserId(request)
  if (!userId) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params

    const task = await prisma.task.findFirst({
      where: { id, userId }, // Multi-tenant filter
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
            icon: true,
            status: true,
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
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/tasks/[id]
 * Update a task
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const userId = await authorizeAndGetUserId(request)
  if (!userId) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    const body = await request.json()

    // Get current task for activity logging (with user scoping)
    const currentTask = await prisma.task.findFirst({ where: { id, userId } })
    if (!currentTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    // Build update data, only include provided fields
    const updateData: any = {}
    
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.status !== undefined) updateData.status = body.status
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.isRecurring !== undefined) updateData.isRecurring = body.isRecurring
    if (body.position !== undefined) updateData.position = body.position
    if (body.statusNote !== undefined) updateData.statusNote = body.statusNote
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.blocker !== undefined) updateData.blocker = body.blocker
    if (body.need !== undefined) updateData.need = body.need
    if (body.outcome !== undefined) updateData.outcome = body.outcome
    if (body.assigneeId !== undefined) updateData.assigneeId = body.assigneeId
    if (body.projectId !== undefined) updateData.projectId = body.projectId
    if (body.source !== undefined) updateData.source = body.source
    if (body.dueDate !== undefined) {
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null
    }
    
    // Handle date fields
    if (body.startedAt !== undefined) {
      updateData.startedAt = body.startedAt ? new Date(body.startedAt) : null
    }
    if (body.completedAt !== undefined) {
      updateData.completedAt = body.completedAt ? new Date(body.completedAt) : null
    }
    
    // Auto-set dates based on status changes
    if (body.status === 'IN_PROGRESS' && !body.startedAt && !currentTask.startedAt) {
      updateData.startedAt = new Date()
    }
    if (body.status === 'COMPLETED' && !body.completedAt) {
      updateData.completedAt = new Date()
    }
    
    const task = await prisma.task.update({
      where: { id },
      data: updateData,
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
            icon: true,
            status: true,
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
    let action = 'updated'
    const details: any = {}
    
    if (body.status && body.status !== currentTask.status) {
      action = 'moved'
      details.from = currentTask.status
      details.to = body.status
    }
    if (body.status === 'COMPLETED' && currentTask.status !== 'COMPLETED') {
      action = 'completed'
    }
    
    await prisma.activityLog.create({
      data: {
        action,
        details: JSON.stringify(details),
        taskId: task.id,
      }
    })
    
    // Re-generate embedding if content changed (async, don't block)
    if (body.title || body.description || body.notes || body.outcome || body.blocker || body.need) {
      embedTask(task).catch(err => console.error('Embedding update failed:', err))
    }
    
    return NextResponse.json(task)
  } catch (error: any) {
    console.error('Error updating task:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tasks/[id]
 * Delete a task
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const userId = await authorizeAndGetUserId(request)
  if (!userId) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params

    // Get task info for activity log (with user scoping)
    const task = await prisma.task.findFirst({ where: { id, userId } })
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    await prisma.task.delete({
      where: { id }
    })
    
    // Delete embedding (async)
    deleteTaskEmbedding(id).catch(err => console.error('Embedding delete failed:', err))
    
    // Log activity
    if (task) {
      await prisma.activityLog.create({
        data: {
          action: 'deleted',
          details: JSON.stringify({ title: task.title }),
          taskId: null, // Task is deleted
        }
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting task:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}
