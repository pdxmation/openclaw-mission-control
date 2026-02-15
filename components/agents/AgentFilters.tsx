'use client'

import { useState } from 'react'
import { 
  Users, 
  Zap, 
  Clock, 
  PowerOff,
  LayoutGrid
} from 'lucide-react'

export type AgentFilter = 'all' | 'active' | 'idle' | 'offline'

interface AgentFiltersProps {
  currentFilter: AgentFilter
  onFilterChange: (filter: AgentFilter) => void
  totalAgents: number
  counts?: {
    all: number
    active: number
    idle: number
    offline: number
  }
}

const filters: { id: AgentFilter; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'All', icon: LayoutGrid },
  { id: 'active', label: 'Active', icon: Zap },
  { id: 'idle', label: 'Idle', icon: Clock },
  { id: 'offline', label: 'Offline', icon: PowerOff },
]

export function AgentFilters({ 
  currentFilter, 
  onFilterChange, 
  totalAgents,
  counts
}: AgentFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {filters.map((filter) => {
        const Icon = filter.icon
        const isActive = currentFilter === filter.id
        const count = counts?.[filter.id] ?? (filter.id === 'all' ? totalAgents : undefined)
        
        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              transition-all duration-200
              ${isActive 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }
            `}
          >
            <Icon className="h-4 w-4" />
            {filter.label}
            {count !== undefined && (
              <span className={`
                ml-1 text-xs px-1.5 py-0.5 rounded-full
                ${isActive ? 'bg-primary-foreground/20' : 'bg-muted'}
              `}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
