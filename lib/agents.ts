// Agent data fetching helpers

import { prisma } from '@/lib/prisma'
import { Agent, AgentActivity, AgentStatus, AGENTS_CONFIG } from '@/types/agents'
import { TaskStatus } from '@/generated/prisma/enums'

/**
 * Get the start of today (midnight)
 */
function getStartOfToday(): Date {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

/**
 * Determine agent status based on tasks and activity
 */
function determineAgentStatus(
  inProgressTasks: number,
  lastActivity: Date | null
): AgentStatus {
  // If no last activity, assume offline
  if (!lastActivity) {
    return 'offline'
  }

  const now = new Date()
  const minutesSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60)

  // Busy if has in-progress tasks
  if (inProgressTasks > 0) {
    return 'busy'
  }

  // Idle if no activity in last 30 minutes
  if (minutesSinceActivity > 30) {
    return 'idle'
  }

  return 'online'
}

/**
 * Fetch agent stats from database
 */
export async function fetchAgentStats(userId: string): Promise<Agent[]> {
  const startOfToday = getStartOfToday()

  // Fetch all tasks with agent sources for this user
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      source: {
        not: null,
      },
    },
    select: {
      id: true,
      title: true,
      status: true,
      source: true,
      updatedAt: true,
      completedAt: true,
    },
  })

  // Build agent stats
  const agents: Agent[] = Object.values(AGENTS_CONFIG).map((config) => {
    const agentTasks = tasks.filter((t) => t.source === config.id)
    const inProgressTasks = agentTasks.filter((t) => t.status === TaskStatus.IN_PROGRESS)
    const completedToday = agentTasks.filter(
      (t) => t.status === TaskStatus.COMPLETED && t.completedAt && t.completedAt >= startOfToday
    )

    // Find most recent activity
    const lastActivity = agentTasks.length > 0
      ? agentTasks.reduce((latest, task) => {
          const taskDate = task.completedAt || task.updatedAt
          return taskDate > latest ? taskDate : latest
        }, agentTasks[0].updatedAt)
      : null

    // Get current in-progress task if any
    const currentTask = inProgressTasks.length > 0
      ? {
          id: inProgressTasks[0].id,
          title: inProgressTasks[0].title,
        }
      : undefined

    return {
      ...config,
      status: determineAgentStatus(inProgressTasks.length, lastActivity),
      totalTasks: agentTasks.length,
      inProgressTasks: inProgressTasks.length,
      completedToday: completedToday.length,
      lastActivity: lastActivity?.toISOString() || null,
      currentTask,
    }
  })

  // Sort by status priority: online > busy > idle > offline
  const statusPriority: Record<AgentStatus, number> = {
    online: 0,
    busy: 1,
    idle: 2,
    offline: 3,
  }

  return agents.sort((a, b) => statusPriority[a.status] - statusPriority[b.status])
}

/**
 * Fetch recent agent activity
 */
export async function fetchAgentActivity(
  userId: string,
  limit: number = 20
): Promise<AgentActivity[]> {
  const activities = await prisma.activityLog.findMany({
    where: {
      task: {
        userId,
        source: {
          not: null,
        },
      },
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          source: true,
        },
      },
    },
  })

  return activities
    .filter((a) => a.task?.source && AGENTS_CONFIG[a.task.source])
    .map((activity) => {
      const agentConfig = AGENTS_CONFIG[activity.task!.source!]
      return {
        id: activity.id,
        agentId: agentConfig.id,
        agentName: agentConfig.name,
        agentEmoji: agentConfig.emoji,
        action: activity.action as AgentActivity['action'],
        taskTitle: activity.task?.title || 'Unknown task',
        taskId: activity.task?.id || '',
        timestamp: activity.createdAt.toISOString(),
        details: activity.details || undefined,
      }
    })
}

/**
 * Fetch 7-day completion stats for each agent (for sparklines)
 */
export async function fetchAgentWeeklyStats(
  userId: string
): Promise<Record<string, number[]>> {
  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(now.getDate() - 7)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  // Fetch completed tasks in last 7 days
  const completedTasks = await prisma.task.findMany({
    where: {
      userId,
      source: {
        not: null,
      },
      status: TaskStatus.COMPLETED,
      completedAt: {
        gte: sevenDaysAgo,
      },
    },
    select: {
      source: true,
      completedAt: true,
    },
  })

  // Build daily stats for each agent
  const stats: Record<string, number[]> = {}
  
  // Initialize with zeros for all agents
  Object.keys(AGENTS_CONFIG).forEach((agentId) => {
    stats[agentId] = [0, 0, 0, 0, 0, 0, 0] // 7 days
  })

  // Count completions per day per agent
  completedTasks.forEach((task) => {
    if (!task.source || !task.completedAt) return
    
    const completedDate = new Date(task.completedAt)
    const dayIndex = Math.floor((completedDate.getTime() - sevenDaysAgo.getTime()) / (1000 * 60 * 60 * 24))
    
    if (dayIndex >= 0 && dayIndex < 7 && stats[task.source]) {
      stats[task.source][dayIndex]++
    }
  })

  return stats
}
