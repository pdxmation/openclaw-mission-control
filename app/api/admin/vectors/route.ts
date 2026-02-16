import { NextRequest, NextResponse } from 'next/server'
import { validateApiToken, unauthorizedResponse } from '../../../../lib/api-auth'
import { backfillEmbeddings } from '../../../../lib/embeddings'
import { ensureVectorStore } from '../../../../lib/vector-init'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/vectors
 * Initialize vector store and/or backfill embeddings
 * Body: { action: "init" | "backfill" | "init-and-backfill" }
 * Requires API token authentication
 */
export async function POST(request: NextRequest) {
  // Always require auth for admin endpoints
  if (!validateApiToken(request)) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const action = body.action || 'init-and-backfill'
    
    const result: { success: boolean; actions: string[]; backfill?: unknown } = { success: true, actions: [] }
    
    if (action === 'init' || action === 'init-and-backfill') {
      await ensureVectorStore()
      result.actions.push('initialized')
    }
    
    if (action === 'backfill' || action === 'init-and-backfill') {
      const backfillResult = await backfillEmbeddings()
      result.actions.push('backfilled')
      result.backfill = backfillResult
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Vector admin error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute vector operation' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/vectors
 * Get vector store status
 */
export async function GET(request: NextRequest) {
  if (!validateApiToken(request)) {
    return unauthorizedResponse()
  }

  try {
    const { prisma } = await import('../../../../lib/prisma')
    
    // Check if table exists and count embeddings
    const result = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM public.task_embedding`
    ).catch(() => null)
    
    if (!result) {
      return NextResponse.json({
        initialized: false,
        embeddingCount: 0,
        message: 'Vector store not initialized. POST to /api/admin/vectors with {"action":"init-and-backfill"}'
      })
    }
    
    const taskCount = await prisma.task.count()
    
    return NextResponse.json({
      initialized: true,
      embeddingCount: Number(result[0].count),
      taskCount,
      coverage: taskCount > 0 ? Math.round((Number(result[0].count) / taskCount) * 100) : 0,
    })
  } catch (error) {
    console.error('Vector status error:', error)
    return NextResponse.json(
      { initialized: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
