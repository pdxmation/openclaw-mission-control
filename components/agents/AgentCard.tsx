'use client'

import { Agent, AgentStatus } from '@/types/agents'
import { formatDistanceToNow } from 'date-fns'
import { 
  Circle, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

interface AgentCardProps {
  agent: Agent
}

const statusConfig: Record<AgentStatus, { 
  label: string 
  color: string 
  icon: React.ReactNode 
  bgColor: string
}> = {
  online: {
    label: 'Online',
    color: 'text-green-500',
    icon: <Circle className="h-3 w-3 fill-green-500 text-green-500" />,
    bgColor: 'bg-green-500/10 border-green-500/20',
  },
  busy: {
    label: 'Busy',
    color: 'text-amber-500',
    icon: <Loader2 className="h-3 w-3 animate-spin text-amber-500" />,
    bgColor: 'bg-amber-500/10 border-amber-500/20',
  },
  idle: {
    label: 'Idle',
    color: 'text-slate-400',
    icon: <Clock className="h-3 w-3 text-slate-400" />,
    bgColor: 'bg-slate-500/10 border-slate-500/20',
  },
  offline: {
    label: 'Offline',
    color: 'text-red-400',
    icon: <AlertCircle className="h-3 w-3 text-red-400" />,
    bgColor: 'bg-red-500/10 border-red-500/20',
  },
}

export function AgentCard({ agent }: AgentCardProps) {
  const status = statusConfig[agent.status]

  return (
    <div className={`
      relative p-4 rounded-xl border transition-all duration-200
      ${status.bgColor}
      hover:shadow-md hover:-translate-y-0.5
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl" role="img" aria-label={agent.name}>
            {agent.emoji}
          </span>
          <div>
            <h3 className="font-semibold text-foreground">{agent.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              {status.icon}
              <span className={`text-xs font-medium ${status.color}`}>
                {status.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
        {agent.description}
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 rounded-lg bg-background/50">
          <p className="text-lg font-bold text-foreground">{agent.totalTasks}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-background/50">
          <p className={`text-lg font-bold ${agent.inProgressTasks > 0 ? 'text-amber-500' : 'text-foreground'}`}>
            {agent.inProgressTasks}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-background/50">
          <p className="text-lg font-bold text-emerald-500">{agent.completedToday}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Today</p>
        </div>
      </div>

      {/* Current Task or Last Activity */}
      {agent.currentTask ? (
        <div className="p-2.5 rounded-lg bg-background/50 border border-border/50">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Current Task</p>
          <p className="text-sm font-medium text-foreground truncate">{agent.currentTask.title}</p>
        </div>
      ) : agent.lastActivity ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3 w-3" />
          <span>Last active {formatDistanceToNow(new Date(agent.lastActivity), { addSuffix: true })}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>No recent activity</span>
        </div>
      )}

      {/* Action Link */}
      <Link
        href={`/tasks?source=${agent.id}`}
        className="
          mt-4 flex items-center justify-center gap-1.5 w-full py-2 
          text-xs font-medium text-muted-foreground 
          hover:text-foreground hover:bg-background/50 
          rounded-lg transition-colors
        "
      >
        View Tasks
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  )
}
