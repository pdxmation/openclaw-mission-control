'use client'

import { Agent, AgentStatus } from '@/types/agents'
import { formatDistanceToNow } from 'date-fns'
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Zap,
  MessageSquare,
  BarChart3,
  MoreHorizontal
} from 'lucide-react'
import Link from 'next/link'
import { AgentSparkline } from './AgentSparkline'

interface AgentCardProps {
  agent?: Agent
  weeklyStats?: number[] // 7-day completion counts
  isLoading?: boolean
}

const statusConfig: Record<AgentStatus, { 
  label: string 
  color: string
  bgColor: string
  borderColor: string
  glowColor: string
}> = {
  online: {
    label: 'Online',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    glowColor: 'shadow-emerald-500/20',
  },
  busy: {
    label: 'Busy',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    glowColor: 'shadow-amber-500/20',
  },
  idle: {
    label: 'Idle',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/20',
    glowColor: 'shadow-slate-500/10',
  },
  offline: {
    label: 'Offline',
    color: 'text-red-400',
    bgColor: 'bg-red-500/5',
    borderColor: 'border-red-500/20',
    glowColor: 'shadow-red-500/10',
  },
}

export function AgentCardSkeleton() {
  return (
    <div className="relative rounded-xl border bg-muted/50 border-border p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="h-6 w-14 bg-muted rounded-full animate-pulse" />
      </div>
      <div className="h-10 bg-muted rounded animate-pulse mb-4" />
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="h-12 bg-muted rounded animate-pulse mb-4" />
      <div className="flex items-center gap-2">
        <div className="flex-1 h-9 bg-muted rounded-lg animate-pulse" />
        <div className="h-9 w-20 bg-muted rounded-lg animate-pulse" />
        <div className="h-9 w-9 bg-muted rounded-lg animate-pulse" />
      </div>
    </div>
  )
}

export function AgentCard({ agent, weeklyStats = [0, 0, 0, 0, 0, 0, 0], isLoading }: AgentCardProps) {
  if (isLoading || !agent) {
    return <AgentCardSkeleton />
  }
  
  const status = statusConfig[agent.status]
  const isActive = agent.status === 'online' || agent.status === 'busy'
  const completionRate = agent.totalTasks > 0 
    ? Math.round(((agent.totalTasks - agent.inProgressTasks) / agent.totalTasks) * 100)
    : 0

  return (
    <div
      className={`
        relative group rounded-xl border backdrop-blur-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-4
        ${isActive ? 'hover:shadow-lg ' + status.glowColor : ''}
        ${status.bgColor} ${status.borderColor}
        ${agent.status === 'offline' ? 'opacity-75' : ''}
      `}
    >
      {/* Status Glow Effect for Active Agents */}
      {isActive && (
        <div className={`
          absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500
          ${status.glowColor.replace('shadow-', 'bg-').replace('/20', '/5')}
          blur-xl
        `} />
      )}

      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Avatar with Status Ring */}
            <div className="relative">
              <span className="text-3xl" role="img" aria-label={agent.name}>
                {agent.emoji}
              </span>
              {/* Live Status Indicator */}
              {agent.status === 'busy' && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
              )}
              {agent.status === 'online' && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background"></span>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground">{agent.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                {agent.status === 'busy' ? (
                  <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                ) : (
                  <div className={`w-2 h-2 rounded-full ${status.color.replace('text-', 'bg-')}`} />
                )}
                <span className={`text-xs font-medium ${status.color}`}>
                  {status.label}
                </span>
              </div>
            </div>
          </div>

          {/* Completion Rate Badge */}
          {agent.totalTasks > 0 && (
            <div className={`
              flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
              ${completionRate >= 80 ? 'bg-emerald-500/20 text-emerald-400' : 
                completionRate >= 50 ? 'bg-amber-500/20 text-amber-400' : 
                'bg-slate-500/20 text-slate-400'}
            `}>
              <CheckCircle2 className="h-3 w-3" />
              {completionRate}%
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {agent.description}
        </p>

        {/* Stats Grid with Sparkline */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="text-center p-2 rounded-lg bg-background/50">
            <p className="text-xl font-bold text-foreground">{agent.totalTasks}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/50">
            <p className={`text-xl font-bold ${agent.inProgressTasks > 0 ? 'text-amber-400' : 'text-foreground'}`}>
              {agent.inProgressTasks}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/50">
            <p className="text-xl font-bold text-emerald-400">{agent.completedToday}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Today</p>
          </div>
          <div className="flex items-center justify-center p-2 rounded-lg bg-background/50">
            <AgentSparkline data={weeklyStats} />
          </div>
        </div>

        {/* Current Task */}
        {agent.currentTask ? (
          <div className="p-3 rounded-lg bg-background/60 border border-border/50 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-3 w-3 text-amber-400" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Current Task</p>
            </div>
            <p className="text-sm font-medium text-foreground line-clamp-2">{agent.currentTask.title}</p>
          </div>
        ) : agent.lastActivity ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Clock className="h-3 w-3" />
            <span>Last active {formatDistanceToNow(new Date(agent.lastActivity), { addSuffix: true })}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <AlertCircle className="h-3 w-3" />
            <span>No recent activity</span>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Link
            href={`/tasks?source=${agent.id}`}
            className="
              flex-1 flex items-center justify-center gap-1.5 py-2 
              text-xs font-medium text-muted-foreground 
              hover:text-foreground hover:bg-background/50 
              rounded-lg transition-colors
            "
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Tasks
          </Link>
          
          {isActive && (
            <button
              className="
                flex items-center justify-center gap-1.5 px-3 py-2
                text-xs font-medium text-primary
                hover:bg-primary/10 rounded-lg transition-colors
              "
              onClick={() => {/* TODO: Ping agent */}}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Ping
            </button>
          )}
          
          <button
            className="
              flex items-center justify-center p-2
              text-muted-foreground hover:text-foreground
              hover:bg-background/50 rounded-lg transition-colors
            "
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
