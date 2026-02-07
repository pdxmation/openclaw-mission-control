'use client'

import { useState, useEffect, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Copy, Loader2, Eye, EyeOff } from 'lucide-react'
import {
  getApiKeys,
  createApiKey,
  revokeApiKey,
} from '@/lib/api-keys/actions'
import type { ApiKey } from '@/generated/prisma/client'

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [newKey, setNewKey] = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadKeys = async () => {
      setLoading(true)
      const result = await getApiKeys()
      if (cancelled) return
      if (result.success && result.data) {
        setKeys(result.data)
      }
      setLoading(false)
    }

    loadKeys()

    return () => {
      cancelled = true
    }
  }, [])

  const fetchKeys = async () => {
    setLoading(true)
    const result = await getApiKeys()
    if (result.success && result.data) {
      setKeys(result.data)
    }
    setLoading(false)
  }

  const handleCreate = () => {
    setIsCreating(true)
  }

  const handleSubmitCreate = () => {
    startTransition(async () => {
      const result = await createApiKey(newKeyName || 'Default')
      if (result.success && result.data) {
        setNewKey(result.data.key)
        setIsCreating(false)
        setNewKeyName('')
        fetchKeys()
      }
    })
  }

  const handleRevoke = (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This cannot be undone.')) {
      return
    }

    startTransition(async () => {
      await revokeApiKey(id)
      fetchKeys()
    })
  }

  const handleCopy = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage API keys for programmatic access to your data
              </CardDescription>
            </div>
            {!isCreating && !newKey && (
              <Button onClick={handleCreate} disabled={isPending}>
                <Plus className="h-4 w-4 mr-2" />
                New Key
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* New Key Creation Form */}
          {isCreating && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/50">
              <h3 className="font-medium mb-3">Create New API Key</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Key Name
                  </label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="My API Key"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSubmitCreate} disabled={isPending}>
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Key'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreating(false)}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* New Key Display */}
          {newKey && (
            <div className="mb-6 p-4 border border-primary rounded-lg bg-primary/5">
              <h3 className="font-medium mb-2">Your New API Key</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Make sure to copy this key now. You won&apos;t be able to see it again.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-muted rounded font-mono text-sm overflow-x-auto">
                  {showKey ? newKey : '••••••••••••••••••••••••••••••••'}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setNewKey(null)}
              >
                Done
              </Button>
            </div>
          )}

          {/* Keys Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : keys.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No API keys yet. Create one to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>
                      <code className="text-sm">{key.keyPrefix}...</code>
                    </TableCell>
                    <TableCell>
                      {new Date(key.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {key.lastUsedAt
                        ? new Date(key.lastUsedAt).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      {key.revokedAt ? (
                        <Badge variant="destructive">Revoked</Badge>
                      ) : (
                        <Badge className="bg-primary">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!key.revokedAt && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevoke(key.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Using API Keys</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Include your API key in the Authorization header of your requests:
            </p>
            <code className="block px-3 py-2 bg-background rounded text-sm font-mono mb-4">
              Authorization: Bearer mc_your_api_key_here
            </code>

            <h4 className="font-medium mb-2 mt-4">Agent Source Header (Optional)</h4>
            <p className="text-sm text-muted-foreground mb-2">
              When multiple agents use the same account, add the{' '}
              <code className="text-xs">X-Agent-Source</code> header to prevent duplicate tasks:
            </p>
            <code className="block px-3 py-2 bg-background rounded text-sm font-mono mb-2">
              X-Agent-Source: agent-main
            </code>
            <p className="text-xs text-muted-foreground">
              This identifies which agent created each task. Tasks with the same title and source
              will not be duplicated. The source is displayed in the UI so you can filter by agent.
            </p>

            <h4 className="font-medium mb-2 mt-4">Example Request</h4>
            <pre className="block px-3 py-2 bg-background rounded text-xs font-mono overflow-x-auto">
{`curl -X POST https://moltmc.app/api/tasks \\
  -H "Authorization: Bearer mc_your_key" \\
  -H "X-Agent-Source: agent-main" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Daily email check",
    "status": "RECURRING"
  }'`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
