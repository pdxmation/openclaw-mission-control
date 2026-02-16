import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { authorizeRequest, unauthorizedResponse } from '../../../../lib/api-auth'
import { searchTasksBySimilarity } from '../../../../lib/embeddings'

export const dynamic = 'force-dynamic'

/**
 * GET /api/tasks/search?q=<query>&limit=10
 * Semantic search for tasks
 */
export async function GET(request: NextRequest) {
  if (!(await authorizeRequest(request))) {
    return unauthorizedResponse()
  }

  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const minSimilarity = parseFloat(searchParams.get('min') || '0.5')
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      )
    }
    
    // Get similar task IDs
    const similarTasks = await searchTasksBySimilarity(query, limit, minSimilarity)
    
    if (similarTasks.length === 0) {
      return NextResponse.json({ results: [] })
    }
    
    // Fetch full task data
    const taskIds = similarTasks.map(t => t.taskId)
    const tasks = await prisma.task.findMany({
      where: { id: { in: taskIds } },
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
        }
      }
    })
    
    // Map tasks to results with similarity scores
    const taskMap = new Map(tasks.map(t => [t.id, t]))
    const results = similarTasks
      .map(st => ({
        task: taskMap.get(st.taskId),
        similarity: Math.round(st.similarity * 100) / 100, // Round to 2 decimals
      }))
      .filter(r => r.task) // Filter out any missing tasks
    
    return NextResponse.json({ results })
  } catch (error) {
    console.error('Error searching tasks:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { 
        error: 'Failed to search tasks',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
