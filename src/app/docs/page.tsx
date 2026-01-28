import { FileText } from 'lucide-react'

export default function DocsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <FileText className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Documentation</h2>
      <p className="text-muted-foreground max-w-md">
        Documentation and knowledge base coming soon. This will be the central place for
        project docs, guides, and reference materials.
      </p>
    </div>
  )
}
