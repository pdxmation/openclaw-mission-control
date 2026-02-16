import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { authorizeAndGetUserId, unauthorizedResponse } from '../../../lib/api-auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/projects
 * List all projects for the current user
 * Query params: ?status=ACTIVE|ARCHIVED|all
 */
export async function GET(request: NextRequest) {
  const userId = await authorizeAndGetUserId(request)
  if (!userId) {
    return unauthorizedResponse()
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = { userId }
    if (status && status !== 'all') {
      where.status = status
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        _count: {
          select: { tasks: true }
        }
      }
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: NextRequest) {
  const userId = await authorizeAndGetUserId(request)
  if (!userId) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()

    if (!body?.name || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }

    const project = await prisma.project.create({
      data: {
        name: body.name.trim(),
        description: body.description ?? null,
        color: body.color || '#6366f1',
        icon: body.icon || '📁',
        status: body.status || 'ACTIVE',
        userId,
      },
      include: {
        _count: {
          select: { tasks: true }
        }
      }
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
