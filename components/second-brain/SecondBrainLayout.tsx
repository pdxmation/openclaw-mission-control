'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { GraphView } from './GraphView'
import { KanbanView } from './KanbanView'
import { SplitEditor } from './SplitEditor'
import { Toolbar } from './Toolbar'

interface Document {
  id: string
  title: string
  content: string
  type: 'note' | 'journal' | 'concept' | 'research'
  tags: string[]
  createdAt: string
  updatedAt: string
}

type ViewMode = 'editor' | 'graph' | 'kanban'

interface SecondBrainLayoutProps {
  userId: string
}

export function SecondBrainLayout({ userId }: SecondBrainLayoutProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        // API returns { documents: [...] }
        const docs = data.documents || data
        setDocuments(Array.isArray(docs) ? docs : [])
      } else {
        console.error('Failed to fetch documents:', res.status)
        setDocuments([])
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const filteredDocuments = selectedTag
    ? documents.filter(d => d.tags.includes(selectedTag))
    : documents

  const handleCreateDocument = async () => {
    const title = prompt('Document title:')
    if (!title) return

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          content: '',
          type: 'note',
          tags: [],
        }),
      })

      if (res.ok) {
        const newDoc = await res.json()
        setDocuments([newDoc, ...documents])
        setSelectedDoc(newDoc)
        setViewMode('editor')
      }
    } catch (err) {
      console.error('Failed to create document:', err)
    }
  }

  const handleSync = async () => {
    try {
      const res = await fetch('/api/second-brain/sync', {
        credentials: 'include',
      })
      if (res.ok) {
        const result = await res.json()
        alert(`Synced ${result.synced.length} files`)
        fetchDocuments()
      }
    } catch (err) {
      console.error('Failed to sync:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      {sidebarOpen && (
        <Sidebar
          documents={documents}
          selectedDoc={selectedDoc}
          onSelectDoc={(doc) => {
            setSelectedDoc(doc)
            setViewMode('editor')
          }}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
          onCreateDocument={handleCreateDocument}
          onSync={handleSync}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Toolbar
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          selectedDoc={selectedDoc}
          documentCount={filteredDocuments.length}
        />

        <div className="flex-1 overflow-hidden">
          {viewMode === 'graph' && (
            <GraphView
              documents={filteredDocuments}
              onSelectDoc={(doc) => {
                setSelectedDoc(doc)
                setViewMode('editor')
              }}
            />
          )}

          {viewMode === 'kanban' && (
            <KanbanView
              documents={filteredDocuments}
              onSelectDoc={(doc) => {
                setSelectedDoc(doc)
                setViewMode('editor')
              }}
              onUpdateDoc={fetchDocuments}
            />
          )}

          {viewMode === 'editor' && selectedDoc && (
            <SplitEditor
              document={selectedDoc}
              onUpdate={fetchDocuments}
              allDocuments={documents}
            />
          )}

          {viewMode === 'editor' && !selectedDoc && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <p className="text-lg mb-2">Select a document or create a new one</p>
                <button
                  onClick={handleCreateDocument}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  Create Document
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
