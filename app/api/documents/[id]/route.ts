import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { authorizeAndGetUserId, unauthorizedResponse } from '../../../../lib/api-auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * GET /api/documents/[id]
 * Fetch a single document
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const userId = await authorizeAndGetUserId(request)
  if (!userId) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await context.params

    const document = await prisma.document.findFirst({
      where: { id, userId } // Multi-tenant filter
    })
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(document)
  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/documents/[id]
 * Update a document
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const userId = await authorizeAndGetUserId(request)
  if (!userId) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await context.params
    const body = await request.json()

    // Check document exists (with user scoping)
    const existing = await prisma.document.findFirst({
      where: { id, userId }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    const document = await prisma.document.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.tags !== undefined && { tags: body.tags })
      }
    })
    
    return NextResponse.json(document)
  } catch (error) {
    console.error('Error updating document:', error)
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/documents/[id]
 * Delete a document
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const userId = await authorizeAndGetUserId(request)
  if (!userId) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await context.params

    // Check document exists (with user scoping)
    const existing = await prisma.document.findFirst({
      where: { id, userId }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }
    
    await prisma.document.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}
