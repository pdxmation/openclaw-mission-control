import { prisma } from '@/lib/prisma'
import { fetchAgentStats, fetchAgentActivity, fetchAgentWeeklyStats } from '@/lib/agents'
import { AgentCard } from '@/components/agents/AgentCard'
import { AgentActivityFeed } from '@/components/agents/AgentActivityFeed'
import { AgentFilters } from '@/components/agents/AgentFilters'
import { requireUser } from '@/lib/admin/auth'
import { Bot, RefreshCw, Users, Zap } from 'lucide-react'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AgentsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const user = await requireUser()
  const filter = typeof searchParams?.filter === 'string' ? searchParams.filter : 'all'

  const [agents, activities, weeklyStats] = await Promise.all([
    fetchAgentStats(user.id),
    fetchAgentActivity(user.id, 20),
    fetchAgentWeeklyStats(user.id),
  ])

  // Filter agents based on URL param
  const filteredAgents = agents.filter((agent) => {
    if (filter === 'active') return agent.status === 'online' || agent.status === 'busy'
    if (filter === 'idle') return agent.status === 'idle'
    if (filter === 'offline') return agent.status === 'offline'
    return true
  })

  // Sort: Active first, then by task count
  const sortedAgents = [...filteredAgents].sort((a, b) => {
    const statusOrder = { busy: 0, online: 1, idle: 2, offline: 3 }
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status]
    }
    return b.totalTasks - a.totalTasks
  })

  const onlineCount = agents.filter(a => a.status === 'online' || a.status === 'busy').length
  const totalCompletedToday = agents.reduce((sum, a) => sum + a.completedToday, 0)
  const totalActive = agents.reduce((sum, a) => sum + a.inProgressTasks, 0)

  // Serialize dates
  const serializedAgents = sortedAgents.map(agent => ({
    ...agent,
    lastActivity: agent.lastActivity,
  }))

  const serializedActivities = activities.map(activity => ({
    ...activity,
    timestamp: activity.timestamp,
  }))

  return (
    <div className="max-w-[1800px] mx-auto px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Agent Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {onlineCount} of {agents.length} agents active
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Zap className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">{totalCompletedToday} today</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Users className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-400">{totalActive} in progress</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3" />
            <span>Auto-refresh: 30s</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <AgentFilters currentFilter={filter} totalAgents={agents.length} />

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Agent Cards Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
            {serializedAgents.map((agent) => (
              <AgentCard 
                key={agent.id} 
                agent={agent} 
                weeklyStats={weeklyStats[agent.id] || [0, 0, 0, 0, 0, 0, 0]}
              />
            ))}
          </div>

          {/* Empty State */}
          {serializedAgents.length === 0 && (
            <div className="text-center py-16 border border-dashed border-border rounded-xl bg-muted/20">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">No Agents Found</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {filter !== 'all' 
                  ? 'Try a different filter to see more agents' 
                  : 'Agents will appear here once they start creating tasks'}
              </p>
            </div>
          )}
        </div>

        {/* Activity Feed - Desktop Sidebar */}
        <div className="w-full xl:w-96 shrink-0">
          <div className="xl:sticky xl:top-24">
            <Suspense fallback={<div className="h-96 bg-muted/20 rounded-xl animate-pulse" />}>
              <AgentActivityFeed initialActivities={serializedActivities} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
