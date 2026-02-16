import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { authorizeRequest, unauthorizedResponse } from '../../../../lib/api-auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PATCH /api/subtasks/[id]
 * Update a subtask (title, completed, position)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!(await authorizeRequest(request))) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    const body = await request.json()
    
    const updateData: Record<string, unknown> = {}
    
    if (body.title !== undefined) updateData.title = body.title.trim()
    if (body.completed !== undefined) updateData.completed = body.completed
    if (body.position !== undefined) updateData.position = body.position
    
    const subtask = await prisma.subtask.update({
      where: { id },
      data: updateData
    })
    
    return NextResponse.json(subtask)
  } catch (error) {
    console.error('Error updating subtask:', error)
    
    const errorCode = typeof error === 'object' && error && 'code' in error ? (error as { code: string }).code : undefined
    if (errorCode === 'P2025') {
      return NextResponse.json(
        { error: 'Subtask not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update subtask' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/subtasks/[id]
 * Delete a subtask
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!(await authorizeRequest(request))) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    
    await prisma.subtask.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting subtask:', error)
    
    const errorCode = typeof error === 'object' && error && 'code' in error ? (error as { code: string }).code : undefined
    if (errorCode === 'P2025') {
      return NextResponse.json(
        { error: 'Subtask not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete subtask' },
      { status: 500 }
    )
  }
}
