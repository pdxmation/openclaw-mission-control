import { prisma } from '@/lib/prisma'
import { fetchAgentStats, fetchAgentActivity } from '@/lib/agents'
import { AgentCard } from '@/components/agents/AgentCard'
import { AgentActivityFeed } from '@/components/agents/AgentActivityFeed'
import { requireUser } from '@/lib/admin/auth'
import { Bot, RefreshCw } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AgentsPage() {
  const user = await requireUser()

  const [agents, activities] = await Promise.all([
    fetchAgentStats(user.id),
    fetchAgentActivity(user.id, 20),
  ])

  // Serialize dates for client components
  const serializedAgents = agents.map(agent => ({
    ...agent,
    lastActivity: agent.lastActivity,
  }))

  const serializedActivities = activities.map(activity => ({
    ...activity,
    timestamp: activity.timestamp,
  }))

  const onlineCount = agents.filter(a => a.status === 'online' || a.status === 'busy').length

  return (
    <div className="max-w-[1800px] mx-auto px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Agent Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {onlineCount} of {agents.length} agents active
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3" />
          <span>Auto-refresh: 30s</span>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Agent Cards Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {serializedAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>

          {/* Empty State */}
            {serializedAgents.length === 0 && (
              <div className="text-center py-16 border border-dashed border-border rounded-xl">
                <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-1">No Agents Found</h3>
                <p className="text-sm text-muted-foreground">
                  Agents will appear here once they start creating tasks
                </p>
              </div>
            )}
          </div>

          {/* Activity Feed - Desktop Sidebar */}
          <div className="w-full xl:w-80 shrink-0">
            <div className="xl:sticky xl:top-24">
              <AgentActivityFeed initialActivities={serializedActivities} />
            </div>
          </div>
        </div>
      </div>
    )
}
