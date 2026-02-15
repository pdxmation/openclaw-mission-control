'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { 
  Users, 
  Zap, 
  Clock, 
  PowerOff,
  LayoutGrid
} from 'lucide-react'

interface AgentFiltersProps {
  currentFilter: string
  totalAgents: number
}

const filters = [
  { id: 'all', label: 'All', icon: LayoutGrid },
  { id: 'active', label: 'Active', icon: Zap },
  { id: 'idle', label: 'Idle', icon: Clock },
  { id: 'offline', label: 'Offline', icon: PowerOff },
]

export function AgentFilters({ currentFilter, totalAgents }: AgentFiltersProps) {
  const searchParams = useSearchParams()

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {filters.map((filter) => {
        const Icon = filter.icon
        const isActive = currentFilter === filter.id
        
        // Create new URL with filter
        const params = new URLSearchParams(searchParams.toString())
        if (filter.id === 'all') {
          params.delete('filter')
        } else {
          params.set('filter', filter.id)
        }
        const href = `/agents${params.toString() ? `?${params.toString()}` : ''}`

        return (
          <Link
            key={filter.id}
            href={href}
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
            {filter.id === 'all' && (
              <span className={`
                ml-1 text-xs px-1.5 py-0.5 rounded-full
                ${isActive ? 'bg-primary-foreground/20' : 'bg-muted'}
              `}>
                {totalAgents}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
