'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, PanelLeftClose, PanelLeft } from 'lucide-react'
import { DocumentList, Document, DocumentType } from '@/components/docs/DocumentList'
import { DocumentViewer } from '@/components/docs/DocumentViewer'
import { DocumentEditor } from '@/components/docs/DocumentEditor'

export default function DocsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<DocumentType | null>(null)
  const [tagFilter, setTagFilter] = useState<string | null>(null)

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editingDoc, setEditingDoc] = useState<Document | null>(null)

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (typeFilter) params.set('type', typeFilter)
      if (tagFilter) params.set('tag', tagFilter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/documents?${params}`)
      if (!res.ok) throw new Error('Failed to fetch documents')

      const data = await res.json()
      setDocuments(data.documents)
      setAllTags(data.tags)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [typeFilter, tagFilter, search])

  useEffect(() => {
    const debounce = setTimeout(fetchDocuments, 300)
    return () => clearTimeout(debounce)
  }, [fetchDocuments])

  const handleSelectDoc = (doc: Document) => {
    setSelectedDoc(doc)
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const handleCloseViewer = () => {
    setSelectedDoc(null)
    setSidebarOpen(true)
  }

  const handleEdit = (doc: Document) => {
    setEditingDoc(doc)
    setIsEditing(true)
  }

  const handleNewDoc = () => {
    setEditingDoc(null)
    setIsEditing(true)
  }

  const handleSave = async (data: { title: string; content: string; type: DocumentType; tags: string[] }) => {
    try {
      if (editingDoc) {
        // Update
        const res = await fetch(`/api/documents/${editingDoc.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        if (!res.ok) throw new Error('Failed to update document')
        const updated = await res.json()
        setSelectedDoc(updated)
      } else {
        // Create
        const res = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        if (!res.ok) throw new Error('Failed to create document')
        const created = await res.json()
        setSelectedDoc(created)
      }
      setIsEditing(false)
      setEditingDoc(null)
      fetchDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete document')
      setSelectedDoc(null)
      fetchDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditingDoc(null)
  }

  if (isEditing) {
    return (
      <DocumentEditor
        document={editingDoc}
        onSave={handleSave}
        onCancel={handleCancelEdit}
      />
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
      {/* Sidebar */}
      <div
        className={`
          ${isMobile ? 'absolute inset-y-0 left-0 z-30' : 'relative'}
          ${sidebarOpen ? 'w-80' : 'w-0'}
          transition-all duration-200 ease-in-out overflow-hidden flex-shrink-0
          ${isMobile ? 'top-16' : ''}
        `}
        style={{ height: isMobile ? 'calc(100vh - 4rem)' : 'auto' }}
      >
        {sidebarOpen && (
          <div className="w-80 h-full">
            <DocumentList
              documents={documents}
              selectedId={selectedDoc?.id || null}
              onSelect={handleSelectDoc}
              search={search}
              onSearchChange={setSearch}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              tagFilter={tagFilter}
              onTagFilterChange={setTagFilter}
              allTags={allTags}
            />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="border-b border-border px-4 py-2 flex items-center justify-between bg-card/30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </button>

          <div className="flex items-center gap-2">
            {isLoading && (
              <span className="text-xs text-muted-foreground">Loading...</span>
            )}
            <button
              onClick={handleNewDoc}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Document</span>
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Document Viewer */}
        <DocumentViewer
          document={selectedDoc}
          onClose={handleCloseViewer}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isMobile={isMobile}
        />
      </div>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 top-16"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
