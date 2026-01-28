'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Activity, CheckCircle, ArrowRight, Trash2, Plus, Edit } from 'lucide-react'

interface ActivityItem {
  id: string
  action: string
  details: string | null
  createdAt: string
  task: {
    id: string
    title: string
  } | null
  user: {
    id: string
    name: string
    avatar: string | null
    image: string | null
  } | null
}

interface ActivityFeedProps {
  initialActivities?: ActivityItem[]
}

const actionIcons: Record<string, React.ReactNode> = {
  created: <Plus className="h-3 w-3 text-green-500" />,
  moved: <ArrowRight className="h-3 w-3 text-blue-500" />,
  completed: <CheckCircle className="h-3 w-3 text-emerald-500" />,
  deleted: <Trash2 className="h-3 w-3 text-red-500" />,
  updated: <Edit className="h-3 w-3 text-amber-500" />,
}

const actionColors: Record<string, string> = {
  created: 'border-green-500/30 bg-green-500/5',
  moved: 'border-blue-500/30 bg-blue-500/5',
  completed: 'border-emerald-500/30 bg-emerald-500/5',
  deleted: 'border-red-500/30 bg-red-500/5',
  updated: 'border-amber-500/30 bg-amber-500/5',
}

function formatAction(action: string, details: string | null): string {
  if (action === 'moved' && details) {
    try {
      const parsed = JSON.parse(details)
      const from = parsed.from?.replace('_', ' ').toLowerCase()
      const to = parsed.to?.replace('_', ' ').toLowerCase()
      return `moved to ${to}`
    } catch {
      return action
    }
  }
  return action
}

export function ActivityFeed({ initialActivities = [] }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities)
  const [loading, setLoading] = useState(initialActivities.length === 0)

  useEffect(() => {
    if (initialActivities.length === 0) {
      fetchActivities()
    }
  }, [])

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/activity?limit=30')
      const data = await res.json()
      setActivities(data)
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    } finally {
      setLoading(false)
    }
  }

  // Poll for updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchActivities, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-card/50 border border-border rounded-xl h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Recent Activity</h3>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No activity yet
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className={`
                p-3 rounded-lg border text-sm
                ${actionColors[activity.action] || 'border-border bg-background'}
              `}
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  {actionIcons[activity.action] || <Activity className="h-3 w-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground">
                    <span className="font-medium">
                      {activity.task?.title || 'Task'}
                    </span>{' '}
                    <span className="text-muted-foreground">
                      {formatAction(activity.action, activity.details)}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
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
