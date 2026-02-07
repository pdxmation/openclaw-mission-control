'use client'

import { ChevronDown, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface FilterOption {
  id: string
  name: string
  avatar?: string | null
  color?: string
}

interface FilterBarProps {
  assignees: FilterOption[]
  projects: FilterOption[]
  sources: FilterOption[]
  selectedAssignee: string | null
  selectedProject: string | null
  selectedSource: string | null
  onAssigneeChange: (id: string | null) => void
  onProjectChange: (id: string | null) => void
  onSourceChange: (id: string | null) => void
}

function FilterDropdown({
  label,
  options,
  selected,
  onChange,
  showAvatar = false,
  showColor = false,
}: {
  label: string
  options: FilterOption[]
  selected: string | null
  onChange: (id: string | null) => void
  showAvatar?: boolean
  showColor?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selectedOption = options.find((o) => o.id === selected)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`
          flex items-center gap-2 px-3 py-2 sm:py-1.5 rounded-lg border touch-manipulation
          ${selected ? 'border-primary bg-primary/10' : 'border-border bg-background'}
          hover:border-primary/50 transition-colors text-sm
        `}
      >
        {selectedOption ? (
          <>
            {showAvatar && selectedOption.avatar && (
              <img src={selectedOption.avatar} alt="" className="w-4 h-4 rounded-full" />
            )}
            {showColor && selectedOption.color && (
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: selectedOption.color }}
              />
            )}
            <span>{selectedOption.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onChange(null)
              }}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : (
          <>
            <span className="text-muted-foreground">{label}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-50 py-1 max-h-64 overflow-y-auto">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">No options</div>
          ) : (
            options.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  onChange(option.id)
                  setOpen(false)
                }}
                className={`
                  w-full px-3 py-2 text-left text-sm flex items-center gap-2
                  hover:bg-accent transition-colors
                  ${selected === option.id ? 'bg-accent' : ''}
                `}
              >
                {showAvatar && (
                  option.avatar ? (
                    <img src={option.avatar} alt="" className="w-5 h-5 rounded-full" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">
                      {option.name.charAt(0)}
                    </div>
                  )
                )}
                {showColor && option.color && (
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                )}
                {option.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export function FilterBar({
  assignees,
  projects,
  sources,
  selectedAssignee,
  selectedProject,
  selectedSource,
  onAssigneeChange,
  onProjectChange,
  onSourceChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <span className="text-sm text-muted-foreground hidden sm:inline">Filter:</span>
      <FilterDropdown
        label="Assignee"
        options={assignees}
        selected={selectedAssignee}
        onChange={onAssigneeChange}
        showAvatar
      />
      <FilterDropdown
        label="Project"
        options={projects}
        selected={selectedProject}
        onChange={onProjectChange}
        showColor
      />
      <FilterDropdown
        label="Source"
        options={sources}
        selected={selectedSource}
        onChange={onSourceChange}
      />
    </div>
  )
}
