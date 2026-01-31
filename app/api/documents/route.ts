import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { authorizeAndGetUserId, unauthorizedResponse } from '../../../lib/api-auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/documents
 * Fetch all documents with optional filters
 * Query params: ?type=journal|note|concept|research&tag=tagname&search=query
 */
export async function GET(request: NextRequest) {
  const userId = await authorizeAndGetUserId(request)
  if (!userId) {
    return unauthorizedResponse()
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const tag = searchParams.get('tag')
    const search = searchParams.get('search')

    // Build where clause with multi-tenant filter
    const where: Record<string, unknown> = { userId }

    if (type) {
      where.type = type
    }

    if (tag) {
      where.tags = { has: tag }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { updatedAt: 'desc' }
    })

    // Get all unique tags for filter UI (scoped to user)
    const allDocs = await prisma.document.findMany({
      where: { userId },
      select: { tags: true }
    })
    const allTags = [...new Set(allDocs.flatMap(d => d.tags))].sort()
    
    return NextResponse.json({
      documents,
      tags: allTags,
      total: documents.length
    })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/documents
 * Create a new document
 */
export async function POST(request: NextRequest) {
  const userId = await authorizeAndGetUserId(request)
  if (!userId) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()

    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const document = await prisma.document.create({
      data: {
        title: body.title,
        content: body.content || '',
        type: body.type || 'note',
        tags: body.tags || [],
        userId, // Multi-tenant: assign to current user
      }
    })
    
    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    )
  }
}
