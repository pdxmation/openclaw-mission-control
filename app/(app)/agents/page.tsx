'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { AgentCard } from '@/components/agents/AgentCard'
import { AgentActivityFeed } from '@/components/agents/AgentActivityFeed'
import { AgentFilters, AgentFilter } from '@/components/agents/AgentFilters'
import { Bot, RefreshCw, Users, Zap, AlertCircle } from 'lucide-react'
import { Agent, AgentActivity } from '@/types/agents'

interface AgentsData {
  agents: Agent[]
  updatedAt: string
}

interface ActivityData {
  activities: AgentActivity[]
  updatedAt: string
}

interface WeeklyStatsData {
  weeklyStats: Record<string, number[]>
  updatedAt: string
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }
  return res.json()
}

export default function AgentsPage() {
  const [filter, setFilter] = useState<AgentFilter>('all')
  
  // Fetch agent stats with polling
  const { 
    data: agentsData, 
    error: agentsError, 
    isLoading: agentsLoading,
    mutate: mutateAgents 
  } = useSWR<AgentsData>('/api/agents/stats', fetcher, {
    refreshInterval: 5000, // Poll every 5 seconds
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  })
  
  // Fetch weekly stats with polling
  const { 
    data: weeklyStatsData,
    error: weeklyError,
    isLoading: weeklyLoading 
  } = useSWR<WeeklyStatsData>('/api/agents/weekly-stats', fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  })

  const agents = agentsData?.agents || []
  const weeklyStats = weeklyStatsData?.weeklyStats || {}
  
  // Calculate filter counts
  const filterCounts = useMemo(() => {
    return {
      all: agents.length,
      active: agents.filter(a => a.status === 'online' || a.status === 'busy').length,
      idle: agents.filter(a => a.status === 'idle').length,
      offline: agents.filter(a => a.status === 'offline').length,
    }
  }, [agents])

  // Filter and sort agents
  const filteredAgents = useMemo(() => {
    const filtered = agents.filter((agent) => {
      if (filter === 'active') return agent.status === 'online' || agent.status === 'busy'
      if (filter === 'idle') return agent.status === 'idle'
      if (filter === 'offline') return agent.status === 'offline'
      return true
    })

    // Sort: Active first, then by task count
    return [...filtered].sort((a, b) => {
      const statusOrder = { busy: 0, online: 1, idle: 2, offline: 3 }
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status]
      }
      return b.totalTasks - a.totalTasks
    })
  }, [agents, filter])

  // Calculate stats
  const onlineCount = agents.filter(a => a.status === 'online' || a.status === 'busy').length
  const totalCompletedToday = agents.reduce((sum, a) => sum + a.completedToday, 0)
  const totalActive = agents.reduce((sum, a) => sum + a.inProgressTasks, 0)

  const isLoading = agentsLoading || weeklyLoading
  const hasError = agentsError || weeklyError

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
              {isLoading ? (
                <span className="inline-block w-20 h-4 bg-muted rounded animate-pulse" />
              ) : (
                `${onlineCount} of ${agents.length} agents active`
              )}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Zap className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">
              {isLoading ? '-' : totalCompletedToday} today
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Users className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-400">
              {isLoading ? '-' : totalActive} in progress
            </span>
          </div>
          
          {/* Manual Refresh Button */}
          <button
            onClick={() => {
              mutateAgents()
            }}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <AgentFilters 
        currentFilter={filter} 
        onFilterChange={setFilter}
        totalAgents={agents.length}
        counts={filterCounts}
      />

      {/* Error State */}
      {hasError && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Failed to load agent data. Please try refreshing.</span>
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Agent Cards Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
            {isLoading ? (
              // Loading skeletons
              [...Array(5)].map((_, i) => (
                <AgentCard key={i} isLoading />
              ))
            ) : (
              filteredAgents.map((agent) => (
                <AgentCard 
                  key={agent.id} 
                  agent={agent} 
                  weeklyStats={weeklyStats[agent.id] || [0, 0, 0, 0, 0, 0, 0]}
                />
              ))
            )}
          </div>

          {/* Empty State */}
          {!isLoading && filteredAgents.length === 0 && (
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
            <AgentActivityFeed />
          </div>
        </div>
      </div>
    </div>
  )
}
