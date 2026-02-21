'use client'

import { useMemo } from 'react'

interface Document {
  id: string
  title: string
  content: string
  type: 'note' | 'journal' | 'concept' | 'research'
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface KanbanViewProps {
  documents: Document[]
  onSelectDoc: (doc: Document) => void
  onUpdateDoc: () => void
}

const COLUMNS: { id: Document['type']; label: string; borderColor: string; bgColor: string; textColor: string }[] = [
  { id: 'concept', label: 'Concepts', borderColor: 'border-amber-500/50', bgColor: 'bg-amber-500/5', textColor: 'text-amber-400' },
  { id: 'research', label: 'Research', borderColor: 'border-blue-500/50', bgColor: 'bg-blue-500/5', textColor: 'text-blue-400' },
  { id: 'note', label: 'Notes', borderColor: 'border-slate-500/50', bgColor: 'bg-slate-500/5', textColor: 'text-slate-400' },
  { id: 'journal', label: 'Journals', borderColor: 'border-green-500/50', bgColor: 'bg-green-500/5', textColor: 'text-green-400' },
]

export function KanbanView({ documents, onSelectDoc, onUpdateDoc }: KanbanViewProps) {
  const groupedDocs = useMemo(() => {
    const groups: Record<string, Document[]> = {
      concept: [],
      research: [],
      note: [],
      journal: [],
    }
    
    for (const doc of documents) {
      if (groups[doc.type]) {
        groups[doc.type].push(doc)
      }
    }
    
    // Sort by updatedAt desc
    for (const type of Object.keys(groups)) {
      groups[type].sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    }
    
    return groups
  }, [documents])

  const handleDragStart = (e: React.DragEvent, docId: string) => {
    e.dataTransfer.setData('text/plain', docId)
  }

  const handleDrop = async (e: React.DragEvent, newType: Document['type']) => {
    e.preventDefault()
    const docId = e.dataTransfer.getData('text/plain')
    
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: newType }),
      })
      
      if (res.ok) {
        onUpdateDoc()
      }
    } catch (err) {
      console.error('Failed to move document:', err)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  function truncateContent(content: string, maxLength: number = 100): string {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength) + '...'
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="h-full overflow-x-auto">
      <div className="flex gap-4 p-4 min-w-max h-full">
        {COLUMNS.map(column => (
          <div
            key={column.id}
            className={`w-80 flex-shrink-0 rounded-xl border-2 ${column.borderColor} ${column.bgColor} flex flex-col transition-all`}
            onDrop={(e) => handleDrop(e, column.id)}
            onDragOver={handleDragOver}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between p-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <h2 className={`font-semibold text-sm ${column.textColor}`}>
                  {column.label}
                </h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {groupedDocs[column.id].length}
                </span>
              </div>
            </div>

            {/* Column Content */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {groupedDocs[column.id].map(doc => (
                <div
                  key={doc.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, doc.id)}
                  onClick={() => onSelectDoc(doc)}
                  className="bg-card rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-all border border-border/50 hover:border-border"
                >
                  <h4 className="font-medium text-sm mb-1 line-clamp-2 text-foreground">
                    {doc.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {truncateContent(doc.content.replace(/[#*\[\]]/g, ' '), 80)}
                  </p>
                  
                  {/* Tags */}
                  {doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {doc.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                      {doc.tags.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{doc.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Date */}
                  <div className="text-[10px] text-muted-foreground">
                    {formatDate(doc.updatedAt)}
                  </div>
                </div>
              ))}
              
              {groupedDocs[column.id].length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Drop documents here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
