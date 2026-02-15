'use client'

import useSWR from 'swr'
import { formatDistanceToNow } from 'date-fns'
import { Activity, Loader2, CheckCircle, ArrowRight, Plus, Edit, AlertCircle } from 'lucide-react'
import { AgentActivity } from '@/types/agents'

interface ActivityData {
  activities: AgentActivity[]
  updatedAt: string
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch activity')
  }
  return res.json()
}

const actionIcons: Record<string, React.ReactNode> = {
  started: <Loader2 className="h-3 w-3 text-amber-500 animate-spin" />,
  completed: <CheckCircle className="h-3 w-3 text-emerald-500" />,
  moved: <ArrowRight className="h-3 w-3 text-blue-500" />,
  created: <Plus className="h-3 w-3 text-green-500" />,
  updated: <Edit className="h-3 w-3 text-amber-500" />,
  blocked: <AlertCircle className="h-3 w-3 text-red-500" />,
}

const actionLabels: Record<string, string> = {
  started: 'started',
  completed: 'completed',
  moved: 'moved',
  created: 'created',
  updated: 'updated',
  blocked: 'blocked on',
}

export function AgentActivityFeed() {
  const { 
    data, 
    error, 
    isLoading 
  } = useSWR<ActivityData>('/api/agents/activity?limit=20', fetcher, {
    refreshInterval: 5000, // Poll every 5 seconds
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  })

  const activities = data?.activities || []

  return (
    <div className="bg-card border border-border rounded-xl h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Agent Activity</h3>
        <span className="ml-auto text-xs text-muted-foreground">Live</span>
        {isLoading && (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[600px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-400 text-sm">
            Failed to load activity
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No agent activity yet
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="p-3 rounded-lg border border-border bg-background/50 hover:bg-background transition-colors"
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0">
                  {actionIcons[activity.action] || <Activity className="h-3 w-3 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-base" role="img" aria-label={activity.agentName}>
                      {activity.agentEmoji}
                    </span>
                    <span className="font-medium text-foreground text-sm">
                      {activity.agentName}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {actionLabels[activity.action] || activity.action}
                    </span>
                  </div>
                  <p className="text-sm text-foreground font-medium truncate mt-1">
                    {activity.taskTitle}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
