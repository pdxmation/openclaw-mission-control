'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, X, Loader2, Sparkles } from 'lucide-react'
import { TaskWithRelations, TaskStatus } from './types'

interface SearchResult {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: string
  similarity: number
}

interface SearchApiResult {
  task: {
    id: string
    title: string
    description: string | null
    status: TaskStatus
    priority: string
  }
  similarity: number
}

interface SearchBarProps {
  onSelectTask: (taskId: string) => void
}

const statusColors: Record<TaskStatus, string> = {
  RECURRING: 'bg-purple-500',
  BACKLOG: 'bg-slate-500',
  IN_PROGRESS: 'bg-blue-500',
  REVIEW: 'bg-amber-500',
  BLOCKED: 'bg-red-500',
  COMPLETED: 'bg-emerald-500',
}

const statusLabels: Record<TaskStatus, string> = {
  RECURRING: 'Recurring',
  BACKLOG: 'Backlog',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  BLOCKED: 'Blocked',
  COMPLETED: 'Completed',
}

export function SearchBar({ onSelectTask }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Keyboard shortcut: Cmd/Ctrl + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setOpen(false)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/tasks/search?q=${encodeURIComponent(searchQuery)}&limit=8`)
      if (res.ok) {
        const data = await res.json()
        // API returns { results: [{ task, similarity }] }
        const mappedResults: SearchResult[] = (data.results || []).map((r: SearchApiResult) => ({
          id: r.task.id,
          title: r.task.title,
          description: r.task.description,
          status: r.task.status,
          priority: r.task.priority,
          similarity: r.similarity,
        }))
        setResults(mappedResults)
        setOpen(true)
        setSelectedIndex(0)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      search(value)
    }, 300)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % results.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length)
        break
      case 'Enter':
        e.preventDefault()
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex])
        }
        break
      case 'Escape':
        setOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  const handleSelect = (result: SearchResult) => {
    onSelectTask(result.id)
    setOpen(false)
    setQuery('')
    setResults([])
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {loading ? (
            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search tasks... (⌘K)"
          className="w-full sm:w-64 lg:w-80 pl-10 pr-10 py-2 sm:py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Semantic search indicator */}
          <div className="px-3 py-2 bg-primary/5 border-b border-border flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="text-xs text-muted-foreground">
              AI-powered semantic search
            </span>
          </div>

          {/* Results list */}
          <div className="max-h-80 overflow-y-auto">
            {results.map((result, index) => (
              <button
                key={result.id}
                onClick={() => handleSelect(result)}
                className={`
                  w-full px-4 py-3 text-left flex items-start gap-3 transition-colors
                  ${index === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'}
                  ${index !== results.length - 1 ? 'border-b border-border/50' : ''}
                `}
              >
                {/* Status indicator */}
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${statusColors[result.status]}`} />
                
                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <p className="font-medium text-sm text-foreground line-clamp-1">
                    {result.title}
                  </p>
                  
                  {/* Description preview */}
                  {result.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {result.description}
                    </p>
                  )}
                  
                  {/* Meta */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {statusLabels[result.status]}
                    </span>
                    <span className="text-xs text-muted-foreground/50">•</span>
                    <span className="text-xs text-primary/70">
                      {Math.round(result.similarity * 100)}% match
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Keyboard hints */}
          <div className="px-3 py-2 bg-muted/30 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
            <span><kbd className="px-1.5 py-0.5 bg-background rounded border">↑↓</kbd> navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-background rounded border">↵</kbd> select</span>
            <span><kbd className="px-1.5 py-0.5 bg-background rounded border">esc</kbd> close</span>
          </div>
        </div>
      )}

      {/* No results */}
      {open && query && !loading && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 p-4 text-center">
          <p className="text-sm text-muted-foreground">No tasks found for &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </div>
  )
}
