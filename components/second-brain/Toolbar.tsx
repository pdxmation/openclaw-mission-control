'use client'

import { useState } from 'react'

interface ToolbarProps {
  viewMode: 'editor' | 'graph' | 'kanban'
  onChangeViewMode: (mode: 'editor' | 'graph' | 'kanban') => void
  sidebarOpen: boolean
  onToggleSidebar: () => void
  selectedDoc: { title: string } | null
  documentCount: number
}

export function Toolbar({
  viewMode,
  onChangeViewMode,
  sidebarOpen,
  onToggleSidebar,
  selectedDoc,
  documentCount,
}: ToolbarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="h-14 border-b flex items-center px-4 gap-4 bg-background">
      {/* Toggle Sidebar */}
      <button
        onClick={onToggleSidebar}
        className="p-2 hover:bg-muted rounded-lg"
        title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
      >
        {sidebarOpen ? '◀' : '▶'}
      </button>

      {/* Document Title (if in editor mode) */}
      {viewMode === 'editor' && selectedDoc && (
        <div className="font-medium truncate max-w-md">
          {selectedDoc.title}
        </div>
      )}

      {/* View Mode Toggles */}
      <div className="flex items-center bg-muted rounded-lg p-1 ml-auto">
        <button
          onClick={() => onChangeViewMode('kanban')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'kanban'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          📋 Kanban
        </button>
        <button
          onClick={() => onChangeViewMode('graph')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'graph'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          🕸️ Graph
        </button>
        <button
          onClick={() => onChangeViewMode('editor')}
          disabled={!selectedDoc}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'editor'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground disabled:opacity-50'
          }`}
        >
          ✏️ Editor
        </button>
      </div>

      {/* Document Count */}
      <div className="text-sm text-muted-foreground">
        {documentCount} docs
      </div>
    </div>
  )
}
