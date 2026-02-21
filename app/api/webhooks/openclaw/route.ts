import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const WEBHOOK_SECRET = process.env.OPENCLAW_WEBHOOK_SECRET

interface OpenClawWebhookPayload {
  event: 'conversation.complete'
  sessionId: string
  agentSource: string
  userId: string
  conversation: {
    messages: Array<{
      role: 'user' | 'assistant'
      content: string
      timestamp: string
    }>
    startTime: string
    endTime: string
  }
  importance?: number
}

/**
 * POST /api/webhooks/openclaw
 * Receive conversation data from OpenClaw and auto-create documents
 */
export async function POST(request: NextRequest) {
  // Verify webhook secret
  const authHeader = request.headers.get('authorization')
  if (!WEBHOOK_SECRET || authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const payload: OpenClawWebhookPayload = await request.json()

    // Only process completed conversations
    if (payload.event !== 'conversation.complete') {
      return NextResponse.json({ status: 'ignored' })
    }

    // Skip low-importance conversations
    if (payload.importance && payload.importance < 0.5) {
      return NextResponse.json({ status: 'skipped', reason: 'low_importance' })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Extract key concepts from conversation
    const concepts = await extractConcepts(payload.conversation)
    
    const createdDocs: Array<{ id: string; title: string; type: string }> = []
    const skippedConcepts: string[] = []

    // Create documents for high-importance concepts
    for (const concept of concepts) {
      if (concept.importance >= 0.7) {
        const doc = await prisma.document.create({
          data: {
            userId: payload.userId,
            title: concept.title,
            content: formatConceptDocument(concept, payload),
            type: concept.category,
            tags: [...concept.tags, 'auto-generated', payload.agentSource.toLowerCase()],
          },
        })
        createdDocs.push({ id: doc.id, title: doc.title, type: doc.type })
      } else {
        skippedConcepts.push(concept.title)
      }
    }

    return NextResponse.json({
      status: 'success',
      created: createdDocs,
      skipped: skippedConcepts,
    })
  } catch (error) {
    console.error('Error processing OpenClaw webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

interface ExtractedConcept {
  title: string
  summary: string
  importance: number
  tags: string[]
  category: 'note' | 'journal' | 'concept' | 'research'
}

async function extractConcepts(
  conversation: OpenClawWebhookPayload['conversation']
): Promise<ExtractedConcept[]> {
  // Combine all messages into text
  const text = conversation.messages
    .map(m => `${m.role}: ${m.content}`)
    .join('\n\n')

  // Simple extraction based on keywords and patterns
  const concepts: ExtractedConcept[] = []

  // Extract decisions (marked by ✅ or "decided" or "agreed")
  const decisionMatches = text.match(/(?:✅|decided|agreed|conclusion):?\s*([^\n]+)/gi)
  if (decisionMatches) {
    for (const match of decisionMatches.slice(0, 3)) {
      const decision = match.replace(/(?:✅|decided|agreed|conclusion):?\s*/i, '').trim()
      if (decision.length > 10) {
        concepts.push({
          title: decision.slice(0, 60),
          summary: decision,
          importance: 0.9,
          tags: ['decision'],
          category: 'concept',
        })
      }
    }
  }

  // Extract key learnings (marked by 💡 or "learned" or "discovered")
  const learningMatches = text.match(/(?:💡|learned|discovered|realized):?\s*([^\n]+)/gi)
  if (learningMatches) {
    for (const match of learningMatches.slice(0, 3)) {
      const learning = match.replace(/(?:💡|learned|discovered|realized):?\s*/i, '').trim()
      if (learning.length > 10) {
        concepts.push({
          title: learning.slice(0, 60),
          summary: learning,
          importance: 0.8,
          tags: ['learning'],
          category: 'research',
        })
      }
    }
  }

  // Extract tasks/actions (marked by 📋 or "TODO" or "action item")
  const taskMatches = text.match(/(?:📋|TODO|action item|task):?\s*([^\n]+)/gi)
  if (taskMatches) {
    for (const match of taskMatches.slice(0, 2)) {
      const task = match.replace(/(?:📋|TODO|action item|task):?\s*/i, '').trim()
      if (task.length > 10) {
        concepts.push({
          title: `Action: ${task.slice(0, 50)}`,
          summary: task,
          importance: 0.85,
          tags: ['action-item'],
          category: 'note',
        })
      }
    }
  }

  // If no structured concepts found, create a general summary
  if (concepts.length === 0) {
    const firstUserMsg = conversation.messages.find(m => m.role === 'user')
    if (firstUserMsg && firstUserMsg.content.length > 20) {
      concepts.push({
        title: `Conversation: ${firstUserMsg.content.slice(0, 50)}...`,
        summary: firstUserMsg.content,
        importance: 0.6,
        tags: ['conversation'],
        category: 'note',
      })
    }
  }

  return concepts
}

function formatConceptDocument(
  concept: ExtractedConcept,
  payload: OpenClawWebhookPayload
): string {
  const date = new Date().toISOString().split('T')[0]
  
  return `# ${concept.title}

**Category:** ${concept.category}  
**Importance:** ${Math.round(concept.importance * 100)}%  
**Discovered:** ${date}  
**Source:** ${payload.agentSource} conversation  
**Session:** ${payload.sessionId}

## Summary
${concept.summary}

## Full Conversation Context
${payload.conversation.messages.map(m => `**${m.role}:** ${m.content.slice(0, 200)}${m.content.length > 200 ? '...' : ''}`).join('\n\n')}

## Related
- [[Daily Journal ${date}]]

---
*Auto-generated from OpenClaw conversation*
`
}
