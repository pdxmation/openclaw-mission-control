import { prisma } from '../prisma'
import { generateConversationSummary } from './concept-extractor'

export interface SessionSummary {
  sessionId: string
  agentSource: string
  startTime: Date
  endTime: Date
  conversationText: string
  summary?: {
    summary: string
    keyTopics: string[]
    keyDecisions: string[]
    importance: number
  }
}

export interface DailyJournalInput {
  date: Date
  sessions: SessionSummary[]
}

/**
 * Generate a daily journal document from session summaries
 * 
 * @param input - Daily journal input data
 * @param userId - The user ID to create the journal for
 * @returns The created journal document
 */
export async function generateDailyJournal(
  input: DailyJournalInput,
  userId: string
): Promise<Awaited<ReturnType<typeof prisma.document.create>>> {
  const { date, sessions } = input

  // Sort sessions by start time
  const sortedSessions = [...sessions].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  )

  // Generate summaries for sessions that don't have them
  const sessionsWithSummaries = await Promise.all(
    sortedSessions.map(async (session) => {
      if (session.summary) {
        return session
      }
      const summary = await generateConversationSummary(session.conversationText)
      return { ...session, summary }
    })
  )

  // Filter out low-importance sessions
  const significantSessions = sessionsWithSummaries.filter(
    (s) => (s.summary?.importance || 0) > 0.3
  )

  // Group sessions by time of day
  const morningSessions = significantSessions.filter((s) => s.startTime.getHours() < 12)
  const afternoonSessions = significantSessions.filter(
    (s) => s.startTime.getHours() >= 12 && s.startTime.getHours() < 18
  )
  const eveningSessions = significantSessions.filter((s) => s.startTime.getHours() >= 18)

  // Collect all key decisions
  const allDecisions = significantSessions.flatMap(
    (s) => s.summary?.keyDecisions || []
  )

  // Collect all key topics
  const allTopics = [...new Set(significantSessions.flatMap((s) => s.summary?.keyTopics || []))]

  // Collect all agents involved
  const agentsInvolved = [...new Set(significantSessions.map((s) => s.agentSource))]

  // Generate journal content
  const content = generateJournalMarkdown({
    date,
    morningSessions,
    afternoonSessions,
    eveningSessions,
    allDecisions,
    allTopics,
    agentsInvolved,
    totalSessions: significantSessions.length
  })

  // Create title based on date
  const title = `Daily Journal - ${date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`

  // Check if journal already exists for this date
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(startOfDay)
  endOfDay.setDate(endOfDay.getDate() + 1)

  const existingJournal = await prisma.document.findFirst({
    where: {
      userId,
      type: 'journal',
      title: { contains: date.toISOString().split('T')[0], mode: 'insensitive' },
      createdAt: {
        gte: startOfDay,
        lt: endOfDay
      }
    }
  })

  if (existingJournal) {
    // Update existing journal
    return prisma.document.update({
      where: { id: existingJournal.id },
      data: {
        content,
        tags: ['journal', 'daily', 'auto-generated', ...agentsInvolved.map((a) => a.toLowerCase())]
      }
    })
  }

  // Create new journal
  return prisma.document.create({
    data: {
      title,
      content,
      type: 'journal',
      tags: ['journal', 'daily', 'auto-generated', ...agentsInvolved.map((a) => a.toLowerCase())],
      userId
    }
  })
}

/**
 * Generate markdown content for daily journal
 */
function generateJournalMarkdown({
  date,
  morningSessions,
  afternoonSessions,
  eveningSessions,
  allDecisions,
  allTopics,
  agentsInvolved,
  totalSessions
}: {
  date: Date
  morningSessions: SessionSummary[]
  afternoonSessions: SessionSummary[]
  eveningSessions: SessionSummary[]
  allDecisions: string[]
  allTopics: string[]
  agentsInvolved: string[]
  totalSessions: number
}): string {
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  let content = `# Daily Journal - ${dateStr}

**Agents:** ${agentsInvolved.join(', ')}  
**Sessions:** ${totalSessions}  
**Generated:** ${new Date().toLocaleString('en-US')}

---

`

  // Morning section
  if (morningSessions.length > 0) {
    content += `## Morning\n\n`
    for (const session of morningSessions) {
      const time = session.startTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
      content += `### ${time} - ${session.agentSource}\n\n`
      content += `${session.summary?.summary || 'No summary available.'}\n\n`

      if (session.summary?.keyTopics && session.summary.keyTopics.length > 0) {
        content += `**Topics:** ${session.summary.keyTopics.join(', ')}\n\n`
      }
    }
  }

  // Afternoon section
  if (afternoonSessions.length > 0) {
    content += `## Afternoon\n\n`
    for (const session of afternoonSessions) {
      const time = session.startTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
      content += `### ${time} - ${session.agentSource}\n\n`
      content += `${session.summary?.summary || 'No summary available.'}\n\n`

      if (session.summary?.keyTopics && session.summary.keyTopics.length > 0) {
        content += `**Topics:** ${session.summary.keyTopics.join(', ')}\n\n`
      }
    }
  }

  // Evening section
  if (eveningSessions.length > 0) {
    content += `## Evening\n\n`
    for (const session of eveningSessions) {
      const time = session.startTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
      content += `### ${time} - ${session.agentSource}\n\n`
      content += `${session.summary?.summary || 'No summary available.'}\n\n`

      if (session.summary?.keyTopics && session.summary.keyTopics.length > 0) {
        content += `**Topics:** ${session.summary.keyTopics.join(', ')}\n\n`
      }
    }
  }

  // Key Decisions section
  if (allDecisions.length > 0) {
    content += `## Key Decisions\n\n`
    for (const decision of allDecisions) {
      content += `- ${decision}\n`
    }
    content += '\n'
  }

  // Topics Explored section
  if (allTopics.length > 0) {
    content += `## Topics Explored\n\n`
    for (const topic of allTopics) {
      content += `- #${topic.toLowerCase().replace(/\s+/g, '-')}\n`
    }
    content += '\n'
  }

  content += `---\n\n*Auto-generated from OpenClaw conversations*`

  return content
}

/**
 * Get sessions for a specific date range
 * This is a placeholder - in production this would query OpenClaw session data
 * 
 * @param userId - The user ID
 * @param date - The date to get sessions for
 * @returns Array of session summaries
 */
export async function getSessionsForDate(
  userId: string,
  date: Date
): Promise<SessionSummary[]> {
  // In a real implementation, this would query the OpenClaw session database
  // For now, return empty array as this requires OpenClaw integration
  // which will be implemented in PR #4
  
  console.log(`Fetching sessions for user ${userId} on ${date.toISOString()}`)
  return []
}
