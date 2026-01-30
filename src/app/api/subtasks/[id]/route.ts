import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { validateApiToken, unauthorizedResponse } from '../../../../lib/api-auth'

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
 * PATCH /api/subtasks/[id]
 * Update a subtask (title, completed, position)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!isInternalRequest(request) && !validateApiToken(request)) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    const body = await request.json()
    
    const updateData: any = {}
    
    if (body.title !== undefined) updateData.title = body.title.trim()
    if (body.completed !== undefined) updateData.completed = body.completed
    if (body.position !== undefined) updateData.position = body.position
    
    const subtask = await prisma.subtask.update({
      where: { id },
      data: updateData
    })
    
    return NextResponse.json(subtask)
  } catch (error: any) {
    console.error('Error updating subtask:', error)
    
    if (error.code === 'P2025') {
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
  if (!isInternalRequest(request) && !validateApiToken(request)) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    
    await prisma.subtask.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting subtask:', error)
    
    if (error.code === 'P2025') {
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
