import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { validateApiToken, unauthorizedResponse } from '../../../../lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/tasks/[id]
 * Fetch a single task by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!validateApiToken(request)) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    
    const task = await prisma.task.findUnique({
      where: { id }
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
  if (!validateApiToken(request)) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    const body = await request.json()
    
    // Build update data, only include provided fields
    const updateData: any = {}
    
    if (body.title !== undefined) updateData.title = body.title
    if (body.status !== undefined) updateData.status = body.status
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.statusNote !== undefined) updateData.statusNote = body.statusNote
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.blocker !== undefined) updateData.blocker = body.blocker
    if (body.need !== undefined) updateData.need = body.need
    if (body.outcome !== undefined) updateData.outcome = body.outcome
    
    // Handle date fields
    if (body.startedAt !== undefined) {
      updateData.startedAt = body.startedAt ? new Date(body.startedAt) : null
    }
    if (body.completedAt !== undefined) {
      updateData.completedAt = body.completedAt ? new Date(body.completedAt) : null
    }
    
    // Auto-set dates based on status changes
    if (body.status === 'IN_PROGRESS' && !body.startedAt) {
      updateData.startedAt = new Date()
    }
    if (body.status === 'COMPLETED' && !body.completedAt) {
      updateData.completedAt = new Date()
    }
    
    const task = await prisma.task.update({
      where: { id },
      data: updateData
    })
    
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
  if (!validateApiToken(request)) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    
    await prisma.task.delete({
      where: { id }
    })
    
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
