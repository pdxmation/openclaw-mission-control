import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { authorizeAndGetUserId, unauthorizedResponse } from '../../../../lib/api-auth'
import { extractConcepts, Concept } from '@/lib/services/concept-extractor'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export interface AutoCreateRequest {
  source: {
    type: 'openclaw-session'
    sessionId: string
    agentSource: 'R2D2' | 'C3PO' | 'SABINE' | 'K2SO' | 'CHOPPER' | string
    timestamp: string
  }
  conversation: string
  options?: {
    createThreshold?: number // default 0.7 importance
    autoTag?: boolean
  }
}

export interface AutoCreateResponse {
  created: Array<{
    id: string
    title: string
    type: string
    importance: number
  }>
  skipped: Array<{
    title: string
    importance: number
    reason: string
  }>
  summary: {
    totalConcepts: number
    createdCount: number
    skippedCount: number
  }
}

/**
 * POST /api/documents/auto-create
 * Auto-create documents from conversation text using AI concept extraction
 */
export async function POST(request: NextRequest) {
  const userId = await authorizeAndGetUserId(request)
  if (!userId) {
    return unauthorizedResponse()
  }

  try {
    const body: AutoCreateRequest = await request.json()

    // Validate required fields
    if (!body.conversation || body.conversation.trim().length === 0) {
      return NextResponse.json(
        { error: 'Conversation text is required' },
        { status: 400 }
      )
    }

    if (!body.source || !body.source.sessionId) {
      return NextResponse.json(
        { error: 'Source sessionId is required' },
        { status: 400 }
      )
    }

    const threshold = body.options?.createThreshold ?? 0.7

    // Extract concepts using AI
    const concepts = await extractConcepts(body.conversation, {
      minImportance: 0.0, // Get all concepts, filter manually
      maxConcepts: 10,
    })

    if (concepts.length === 0) {
      return NextResponse.json({
        created: [],
        skipped: [],
        summary: {
          totalConcepts: 0,
          createdCount: 0,
          skippedCount: 0,
        },
      })
    }

    const created: AutoCreateResponse['created'] = []
    const skipped: AutoCreateResponse['skipped'] = []

    // Process each concept
    for (const concept of concepts) {
      if (concept.importance >= threshold) {
        // Check for existing document with similar title
        const existingDoc = await findSimilarDocument(userId, concept.title)
        
        if (existingDoc) {
          skipped.push({
            title: concept.title,
            importance: concept.importance,
            reason: 'Similar document already exists',
          })
          continue
        }

        // Create document
        const doc = await createDocumentFromConcept(userId, concept, body.source)
        created.push({
          id: doc.id,
          title: doc.title,
          type: doc.type,
          importance: concept.importance,
        })
      } else {
        skipped.push({
          title: concept.title,
          importance: concept.importance,
          reason: `Importance ${concept.importance.toFixed(2)} below threshold ${threshold}`,
        })
      }
    }

    const response: AutoCreateResponse = {
      created,
      skipped,
      summary: {
        totalConcepts: concepts.length,
        createdCount: created.length,
        skippedCount: skipped.length,
      },
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error auto-creating documents:', error)
    return NextResponse.json(
      { error: 'Failed to auto-create documents' },
      { status: 500 }
    )
  }
}

/**
 * Create a document from an extracted concept
 */
async function createDocumentFromConcept(
  userId: string,
  concept: Concept,
  source: AutoCreateRequest['source']
): Promise<{ id: string; title: string; type: string }> {
  // Map concept category to document type
  const typeMap: Record<string, string> = {
    decision: 'concept',
    idea: 'concept',
    learning: 'research',
    task: 'note',
    concept: 'concept',
  }

  const documentType = typeMap[concept.category] || 'note'

  // Build content with metadata
  const content = `# ${concept.title}

**Category:** ${concept.category}
**Discovered:** ${new Date().toISOString().split('T')[0]}
**Source:** ${source.agentSource} conversation (${source.sessionId})
**Importance:** ${(concept.importance * 100).toFixed(0)}%

## Summary
${concept.summary}

## Implications
[To be filled in]

## Related
- 

---
*Auto-generated from ${source.agentSource} conversation*
`

  const document = await prisma.document.create({
    data: {
      title: concept.title,
      content,
      type: documentType,
      tags: [...concept.tags, 'auto-generated', source.agentSource.toLowerCase()],
      userId,
    },
  })

  return {
    id: document.id,
    title: document.title,
    type: document.type,
  }
}

/**
 * Find similar document by title (fuzzy match)
 */
async function findSimilarDocument(
  userId: string,
  title: string
): Promise<{ id: string; title: string } | null> {
  // Normalize title for comparison
  const normalizedTitle = title.toLowerCase().trim()
  
  const documents = await prisma.document.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      title: true,
    },
    take: 100, // Limit search scope
  })

  // Check for exact match or high similarity
  for (const doc of documents) {
    const docTitle = doc.title.toLowerCase().trim()
    
    // Exact match
    if (docTitle === normalizedTitle) {
      return doc
    }
    
    // Check if titles are very similar (contains relationship)
    if (
      docTitle.includes(normalizedTitle) ||
      normalizedTitle.includes(docTitle)
    ) {
      if (Math.abs(docTitle.length - normalizedTitle.length) < 20) {
        return doc
      }
    }
  }

  return null
}
