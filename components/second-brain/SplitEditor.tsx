'use client'

import { useState, useEffect, useCallback } from 'react'

interface Document {
  id: string
  title: string
  content: string
  type: 'note' | 'journal' | 'concept' | 'research'
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface SplitEditorProps {
  document: Document
  onUpdate: () => void
  allDocuments: Document[]
}

export function SplitEditor({ document: doc, onUpdate, allDocuments }: SplitEditorProps) {
  const [content, setContent] = useState(doc.content)
  const [title, setTitle] = useState(doc.title)
  const [tags, setTags] = useState(doc.tags.join(', '))
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Auto-save after 2 seconds of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content !== doc.content || title !== doc.title || tags !== doc.tags.join(', ')) {
        handleSave()
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [content, title, tags])

  const handleSave = useCallback(async () => {
    if (saving) return
    setSaving(true)

    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          content,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      })

      if (res.ok) {
        setLastSaved(new Date())
        onUpdate()
      }
    } catch (err) {
      console.error('Failed to save:', err)
    } finally {
      setSaving(false)
    }
  }, [content, title, tags, doc.id, saving, onUpdate])

  const renderMarkdown = (text: string): string => {
    // Simple markdown to HTML conversion
    let html = text
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-5 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-muted p-3 rounded-lg overflow-x-auto my-3"><code>$1</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>')
      // Wiki links [[Title]]
      .replace(/\[\[([^\]]+)\]\]/g, '<a href="#" class="text-blue-600 hover:underline bg-blue-50 px-1 rounded">$1</a>')
      // Regular links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank">$1</a>')
      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-muted pl-4 italic my-3">$1</blockquote>')
      // Callouts
      .replace(/^> \[!\w+\] (.*$)/gim, '<div class="bg-blue-50 border-l-4 border-blue-400 p-3 my-3">$1</div>')
      // Lists
      .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
      // Line breaks
      .replace(/\n/g, '<br>')

    return html
  }

  const documentTitles = allDocuments.map(d => d.title.toLowerCase())

  const insertWikiLink = () => {
    const title = prompt('Link to document title:')
    if (title) {
      setContent(c => c + ` [[${title}]]`)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4 space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-0"
          placeholder="Document title..."
        />
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Tags:</span>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="text-sm bg-muted px-2 py-1 rounded border-none focus:ring-1 focus:ring-primary"
              placeholder="tag1, tag2, tag3"
            />
          </div>
          
          <div className="flex-1"></div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={insertWikiLink}
              className="px-3 py-1.5 text-sm bg-muted rounded hover:bg-muted/80"
              title="Insert wiki link"
            >
              [[Link]]
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
        
        {lastSaved && (
          <div className="text-xs text-muted-foreground">
            Last saved: {lastSaved.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Split Editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className="flex-1 flex flex-col border-r">
          <div className="text-xs text-muted-foreground px-3 py-1 bg-muted/50 border-b">
            Markdown
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 w-full p-4 resize-none focus:outline-none font-mono text-sm leading-relaxed"
            placeholder="Start writing... Use [[Title]] for wiki links"
            spellCheck={false}
          />
        </div>

        {/* Preview */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="text-xs text-muted-foreground px-3 py-1 bg-muted/50 border-b">
            Preview
          </div>
          <div
            className="flex-1 p-4 overflow-y-auto prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        </div>
      </div>

      {/* Footer with backlink suggestions */}
      {documentTitles.some(t => content.toLowerCase().includes(t)) && (
        <div className="border-t p-2 bg-muted/30 text-sm">
          <span className="text-muted-foreground">Linked to: </span>
          {documentTitles
            .filter(t => content.toLowerCase().includes(t))
            .slice(0, 5)
            .map((t, i) => (
              <span key={t} className="text-blue-600">
                {i > 0 && ', '}{t}
              </span>
            ))}
        </div>
      )}
    </div>
  )
}
