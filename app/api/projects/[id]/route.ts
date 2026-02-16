import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { authorizeAndGetUserId, unauthorizedResponse } from '../../../../lib/api-auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/projects/[id]
 * Fetch a single project by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const userId = await authorizeAndGetUserId(request)
  if (!userId) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params

    const project = await prisma.project.findFirst({
      where: { id, userId },
      include: {
        _count: { select: { tasks: true } }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/projects/[id]
 * Update a project
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const userId = await authorizeAndGetUserId(request)
  if (!userId) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.project.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.color !== undefined) updateData.color = body.color
    if (body.icon !== undefined) updateData.icon = body.icon
    if (body.status !== undefined) updateData.status = body.status

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: { _count: { select: { tasks: true } } }
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error updating project:', error)
    const errorCode = typeof error === 'object' && error && 'code' in error ? (error as { code: string }).code : undefined
    if (errorCode === 'P2025') {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/projects/[id]
 * Archive by default; pass ?hard=true to delete
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const userId = await authorizeAndGetUserId(request)
  if (!userId) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hard') === 'true'

    const existing = await prisma.project.findFirst({ where: { id, userId } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    if (hardDelete) {
      await prisma.project.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    const project = await prisma.project.update({
      where: { id },
      data: { status: 'ARCHIVED' },
      include: { _count: { select: { tasks: true } } }
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error deleting project:', error)
    const errorCode = typeof error === 'object' && error && 'code' in error ? (error as { code: string }).code : undefined
    if (errorCode === 'P2025') {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
