'use client'

import { useState, useEffect, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CheckCircle2,
  XCircle,
  MailPlus,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import {
  getWaitingListEntries,
  getWaitingListStats,
  approveWaitingListEntry,
  rejectWaitingListEntry,
  resendApprovalEmail,
  bulkApproveEntries,
} from '@/lib/waiting-list/actions'
import type { WaitingList } from '@/generated/prisma/client'

export default function WaitingListPage() {
  const [entries, setEntries] = useState<WaitingList[]>([])
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      setLoading(true)
      const [entriesResult, statsResult] = await Promise.all([
        getWaitingListEntries({
          status: filter === 'all' ? undefined : filter,
        }),
        getWaitingListStats(),
      ])

      if (cancelled) return

      if (entriesResult.success && entriesResult.data) {
        setEntries(entriesResult.data.entries)
      }
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data)
      }
      setLoading(false)
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [filter])

  const fetchData = async () => {
    setLoading(true)
    const [entriesResult, statsResult] = await Promise.all([
      getWaitingListEntries({
        status: filter === 'all' ? undefined : filter,
      }),
      getWaitingListStats(),
    ])

    if (entriesResult.success && entriesResult.data) {
      setEntries(entriesResult.data.entries)
    }
    if (statsResult.success && statsResult.data) {
      setStats(statsResult.data)
    }
    setLoading(false)
  }

  const handleApprove = (id: string) => {
    startTransition(async () => {
      await approveWaitingListEntry(id)
      fetchData()
    })
  }

  const handleReject = (id: string) => {
    startTransition(async () => {
      await rejectWaitingListEntry(id)
      fetchData()
    })
  }

  const handleResend = (id: string) => {
    startTransition(async () => {
      await resendApprovalEmail(id)
    })
  }

  const handleBulkApprove = () => {
    if (selectedIds.length === 0) return
    startTransition(async () => {
      await bulkApproveEntries(selectedIds)
      setSelectedIds([])
      fetchData()
    })
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    const pendingIds = entries.filter((e) => e.status === 'pending').map((e) => e.id)
    if (selectedIds.length === pendingIds.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(pendingIds)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>
      case 'approved':
        return <Badge className="bg-primary">Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Waitlist</h1>
          <p className="text-muted-foreground">Manage waitlist applications</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Applications</CardTitle>
              <CardDescription>Review and manage waitlist applications</CardDescription>
            </div>
            {selectedIds.length > 0 && (
              <Button onClick={handleBulkApprove} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Approve {selectedIds.length} selected
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList>
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : entries.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No {filter === 'all' ? '' : filter} applications
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {filter === 'pending' && (
                        <TableHead className="w-10">
                          <input
                            type="checkbox"
                            checked={selectedIds.length === entries.filter(e => e.status === 'pending').length}
                            onChange={toggleSelectAll}
                          />
                        </TableHead>
                      )}
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id}>
                        {filter === 'pending' && (
                          <TableCell>
                            {entry.status === 'pending' && (
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(entry.id)}
                                onChange={() => toggleSelect(entry.id)}
                              />
                            )}
                          </TableCell>
                        )}
                        <TableCell className="font-medium">{entry.name}</TableCell>
                        <TableCell>{entry.email}</TableCell>
                        <TableCell>{entry.company || '-'}</TableCell>
                        <TableCell>{getStatusBadge(entry.status)}</TableCell>
                        <TableCell>
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {entry.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleApprove(entry.id)}
                                  disabled={isPending}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleReject(entry.id)}
                                  disabled={isPending}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {entry.status === 'approved' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResend(entry.id)}
                                disabled={isPending}
                                title="Resend invitation email"
                              >
                                <MailPlus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
