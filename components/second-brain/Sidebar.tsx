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

interface SidebarProps {
  documents: Document[]
  selectedDoc: Document | null
  onSelectDoc: (doc: Document) => void
  selectedTag: string | null
  onSelectTag: (tag: string | null) => void
  onCreateDocument: () => void
  onSync: () => void
}

export function Sidebar({
  documents,
  selectedDoc,
  onSelectDoc,
  selectedTag,
  onSelectTag,
  onCreateDocument,
  onSync,
}: SidebarProps) {
  // Group documents by type
  const groupedDocs = useMemo(() => {
    const groups: Record<string, Document[]> = {
      journal: [],
      concept: [],
      research: [],
      note: [],
    }
    
    // Safety check - ensure documents is an array
    if (!Array.isArray(documents)) {
      console.warn('Sidebar: documents is not an array', documents)
      return groups
    }
    
    for (const doc of documents) {
      if (groups[doc.type]) {
        groups[doc.type].push(doc)
      } else {
        groups.note.push(doc)
      }
    }
    
    // Sort each group by updatedAt desc
    for (const type of Object.keys(groups)) {
      groups[type].sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    }
    
    return groups
  }, [documents])

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    for (const doc of documents) {
      for (const tag of doc.tags) {
        tagSet.add(tag)
      }
    }
    return Array.from(tagSet).sort()
  }, [documents])

  const typeIcons: Record<string, string> = {
    journal: '📓',
    concept: '💡',
    research: '🔬',
    note: '📝',
  }

  const typeLabels: Record<string, string> = {
    journal: 'Journals',
    concept: 'Concepts',
    research: 'Research',
    note: 'Notes',
  }

  return (
    <div className="w-64 h-full border-r bg-muted/30 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg mb-3">Second Brain</h2>
        <div className="flex gap-2">
          <button
            onClick={onCreateDocument}
            className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
          >
            + New
          </button>
          <button
            onClick={onSync}
            className="px-3 py-2 border rounded-lg text-sm hover:bg-muted"
            title="Sync with ~/2nd-brain/"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Tags Filter */}
      {allTags.length > 0 && (
        <div className="p-4 border-b">
          <h3 className="text-xs font-medium text-muted-foreground uppercase mb-2">
            Tags
          </h3>
          <div className="flex flex-wrap gap-1">
            {selectedTag && (
              <button
                onClick={() => onSelectTag(null)}
                className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full"
              >
                {selectedTag} ✕
              </button>
            )}
            {!selectedTag && allTags.slice(0, 10).map(tag => (
              <button
                key={tag}
                onClick={() => onSelectTag(tag)}
                className="px-2 py-1 text-xs bg-muted rounded-full hover:bg-muted/80"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Document Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {(['journal', 'concept', 'research', 'note'] as const).map(type => {
          const docs = groupedDocs[type]
          if (docs.length === 0) return null

          return (
            <div key={type} className="mb-4">
              <h3 className="text-xs font-medium text-muted-foreground uppercase px-2 mb-1">
                {typeIcons[type]} {typeLabels[type]} ({docs.length})
              </h3>
              <ul className="space-y-0.5">
                {docs.map(doc => (
                  <li key={doc.id}>
                    <button
                      onClick={() => onSelectDoc(doc)}
                      className={`w-full text-left px-2 py-1.5 rounded text-sm truncate ${
                        selectedDoc?.id === doc.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      {doc.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {/* Stats */}
      <div className="p-4 border-t text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>Total:</span>
          <span>{documents.length} docs</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Tags:</span>
          <span>{allTags.length}</span>
        </div>
      </div>
    </div>
  )
}
