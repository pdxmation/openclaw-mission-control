import { NextRequest, NextResponse } from 'next/server'
import { authorizeAndGetUserId, unauthorizedResponse } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { generateDailyJournal, getSessionsForDate } from '@/lib/services/daily-journal'

/**
 * POST /api/cron/daily-journal
 * Trigger daily journal generation for all active users
 * Should be called daily at 23:00 CET by R2-D2 or cron service
 */
export async function POST(req: NextRequest) {
  // Verify authorization (API key or session)
  const userId = await authorizeAndGetUserId(req)
  if (!userId) {
    return unauthorizedResponse()
  }

  const results: Array<{
    success: boolean
    userId: string
    journalId?: string
    sessionsProcessed: number
    error?: string
  }> = []

  // Get yesterday's date (since we run at 23:00, we want to capture the full day)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)

  console.log(`[${new Date().toISOString()}] Starting daily journal generation for ${yesterday.toDateString()}`)

  try {
    // Get all users who have had activity
    const activeUsers = await prisma.user.findMany({
      where: {
        OR: [
          {
            documents: {
              some: {
                createdAt: {
                  gte: yesterday,
                  lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000)
                }
              }
            }
          },
          {
            ownedTasks: {
              some: {
                updatedAt: {
                  gte: yesterday,
                  lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000)
                }
              }
            }
          }
        ]
      },
      select: {
        id: true,
        name: true
      }
    })

    console.log(`[${new Date().toISOString()}] Found ${activeUsers.length} active users`)

    for (const user of activeUsers) {
      try {
        // Get sessions for this user on yesterday
        const sessions = await getSessionsForDate(user.id, yesterday)

        if (sessions.length === 0) {
          results.push({
            success: true,
            userId: user.id,
            sessionsProcessed: 0
          })
          continue
        }

        // Generate daily journal
        const journal = await generateDailyJournal(
          {
            date: yesterday,
            sessions
          },
          user.id
        )

        results.push({
          success: true,
          userId: user.id,
          journalId: journal.id,
          sessionsProcessed: sessions.length
        })

        console.log(`[${new Date().toISOString()}] Created journal for user ${user.id}: ${journal.id}`)
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Failed to generate journal for user ${user.id}:`, error)
        results.push({
          success: false,
          userId: user.id,
          sessionsProcessed: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const totalSessions = results.reduce((sum, r) => sum + r.sessionsProcessed, 0)

    console.log(`[${new Date().toISOString()}] Daily journal generation complete: ${successCount}/${activeUsers.length} users, ${totalSessions} sessions`)

    return NextResponse.json({
      success: true,
      date: yesterday.toISOString(),
      usersProcessed: activeUsers.length,
      successCount,
      totalSessions,
      results,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Daily journal cron failed:`, error)
    return NextResponse.json(
      { 
        error: 'Daily journal generation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cron/daily-journal
 * Health check endpoint
 */
export async function GET(req: NextRequest) {
  const userId = await authorizeAndGetUserId(req)
  if (!userId) {
    return unauthorizedResponse()
  }

  return NextResponse.json({
    status: 'ok',
    endpoint: 'daily-journal',
    description: 'POST to trigger daily journal generation',
    schedule: '23:00 CET daily'
  })
}
