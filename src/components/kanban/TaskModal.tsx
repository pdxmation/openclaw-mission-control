'use client'

import { useState, useEffect } from 'react'
import { TaskWithRelations, KANBAN_COLUMNS } from './types'
import { TaskStatus, Priority } from './types'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface TaskModalProps {
  task?: TaskWithRelations | null
  defaultStatus?: TaskStatus
  isOpen: boolean
  onClose: () => void
  onSave: (data: TaskFormData) => Promise<void>
  onDelete?: (taskId: string) => Promise<void>
}

export interface TaskFormData {
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  isRecurring: boolean
}

export function TaskModal({
  task,
  defaultStatus = 'BACKLOG',
  isOpen,
  onClose,
  onSave,
  onDelete,
}: TaskModalProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    status: defaultStatus,
    priority: 'MEDIUM',
    isRecurring: false,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        isRecurring: task.isRecurring,
      })
    } else {
      setFormData({
        title: '',
        description: '',
        status: defaultStatus,
        priority: 'MEDIUM',
        isRecurring: false,
      })
    }
  }, [task, defaultStatus])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave(formData)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!task || !onDelete) return
    if (!confirm('Are you sure you want to delete this task?')) return
    
    setLoading(true)
    try {
      await onDelete(task.id)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-card border border-border rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-lg sm:mx-4 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-3 sm:py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-base sm:text-sm"
              placeholder="Task title..."
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-3 sm:py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none text-base sm:text-sm"
              placeholder="Task description..."
              rows={3}
            />
          </div>

          {/* Status & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                className="w-full px-3 py-3 sm:py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-base sm:text-sm"
              >
                {KANBAN_COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title}
                  </option>
                ))}
                <option value="COMPLETED">Completed</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                className="w-full px-3 py-3 sm:py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-base sm:text-sm"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          {/* Recurring Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isRecurring"
              checked={formData.isRecurring}
              onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
              className="rounded border-input"
            />
            <label htmlFor="isRecurring" className="text-sm">
              Recurring task
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            {task && onDelete ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !formData.title.trim()}>
                {loading ? 'Saving...' : task ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
