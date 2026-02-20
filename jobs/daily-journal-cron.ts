#!/usr/bin/env tsx
/**
 * Daily Journal Cron Job
 * 
 * This script generates daily journal entries from OpenClaw sessions.
 * It should be scheduled to run daily at 23:00 CET.
 * 
 * Usage:
 *   tsx jobs/daily-journal-cron.ts
 * 
 * Environment variables:
 *   - DATABASE_URL: PostgreSQL connection string
 *   - API_TOKEN: For internal API authentication
 * 
 * Scheduling (cron):
 *   0 23 * * * cd /path/to/mission-control && pnpm tsx jobs/daily-journal-cron.ts >> /var/log/mission-control/daily-journal.log 2>&1
 */

import { prisma } from '../lib/prisma'
import { generateDailyJournal, getSessionsForDate } from '../lib/services/daily-journal'

interface CronResult {
  success: boolean
  userId: string
  journalId?: string
  sessionsProcessed: number
  error?: string
}

/**
 * Generate daily journals for all users with sessions
 */
async function runDailyJournalCron(): Promise<CronResult[]> {
  const results: CronResult[] = []
  
  // Get yesterday's date (since we run at 23:00, we want to capture the full day)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  
  console.log(`[${new Date().toISOString()}] Starting daily journal generation for ${yesterday.toDateString()}`)
  
  try {
    // Get all users who have had activity (have documents or tasks)
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
          console.log(`[${new Date().toISOString()}] No sessions found for user ${user.id}`)
          results.push({
            success: true,
            userId: user.id,
            sessionsProcessed: 0
          })
          continue
        }
        
        console.log(`[${new Date().toISOString()}] Processing ${sessions.length} sessions for user ${user.id}`)
        
        // Generate journal
        const journal = await generateDailyJournal(
          {
            date: yesterday,
            sessions
          },
          user.id
        )
        
        console.log(`[${new Date().toISOString()}] Created journal ${journal.id} for user ${user.id}`)
        
        results.push({
          success: true,
          userId: user.id,
          journalId: journal.id,
          sessionsProcessed: sessions.length
        })
      } catch (userError) {
        const errorMessage = userError instanceof Error ? userError.message : String(userError)
        console.error(`[${new Date().toISOString()}] Error processing user ${user.id}:`, errorMessage)
        
        results.push({
          success: false,
          userId: user.id,
          sessionsProcessed: 0,
          error: errorMessage
        })
      }
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[${new Date().toISOString()}] Fatal error in daily journal cron:`, errorMessage)
    throw error
  }
  
  return results
}

/**
 * Main execution
 */
async function main() {
  console.log(`[${new Date().toISOString()}] =========================================`)
  console.log(`[${new Date().toISOString()}] Daily Journal Cron Job Started`)
  console.log(`[${new Date().toISOString()}] =========================================`)
  
  try {
    const results = await runDailyJournalCron()
    
    const successCount = results.filter((r) => r.success).length
    const failCount = results.filter((r) => !r.success).length
    const totalSessions = results.reduce((sum, r) => sum + r.sessionsProcessed, 0)
    
    console.log(`[${new Date().toISOString()}] =========================================`)
    console.log(`[${new Date().toISOString()}] Cron Job Completed`)
    console.log(`[${new Date().toISOString()}] Results: ${successCount} successful, ${failCount} failed`)
    console.log(`[${new Date().toISOString()}] Total sessions processed: ${totalSessions}`)
    console.log(`[${new Date().toISOString()}] =========================================`)
    
    // Exit with error code if any failures
    if (failCount > 0) {
      console.error(`[${new Date().toISOString()}] Errors occurred during processing:`)
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.error(`[${new Date().toISOString()}] User ${r.userId}: ${r.error}`)
        })
      process.exit(1)
    }
    
    process.exit(0)
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Cron job failed:`, error)
    process.exit(1)
  } finally {
    // Disconnect Prisma client
    await prisma.$disconnect()
  }
}

// Run if executed directly
if (require.main === module) {
  main()
}

export { runDailyJournalCron }
