'use client'

import { useState, useEffect } from 'react'
import { TaskWithRelations, KANBAN_COLUMNS, Subtask } from './types'
import { TaskStatus, Priority } from './types'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { X, Plus, Check, Square, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'

interface TaskModalProps {
  task?: TaskWithRelations | null
  defaultStatus?: TaskStatus
  isOpen: boolean
  onClose: () => void
  onSave: (data: TaskFormData) => Promise<void>
  onDelete?: (taskId: string) => Promise<void>
  onSubtaskChange?: () => void
}

export interface TaskFormData {
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  isRecurring: boolean
  dueDate: Date | null
}

export function TaskModal({
  task,
  defaultStatus = 'BACKLOG',
  isOpen,
  onClose,
  onSave,
  onDelete,
  onSubtaskChange,
}: TaskModalProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    status: defaultStatus,
    priority: 'MEDIUM',
    isRecurring: false,
    dueDate: null,
  })
  const [loading, setLoading] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [subtaskLoading, setSubtaskLoading] = useState(false)

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        isRecurring: task.isRecurring,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
      })
      setSubtasks(task.subtasks || [])
    } else {
      setFormData({
        title: '',
        description: '',
        status: defaultStatus,
        priority: 'MEDIUM',
        isRecurring: false,
        dueDate: null,
      })
      setSubtasks([])
    }
    setNewSubtaskTitle('')
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

  const handleAddSubtask = async () => {
    if (!task || !newSubtaskTitle.trim()) return

    setSubtaskLoading(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSubtaskTitle.trim() }),
      })

      if (response.ok) {
        const newSubtask = await response.json()
        setSubtasks([...subtasks, newSubtask])
        setNewSubtaskTitle('')
        onSubtaskChange?.()
      }
    } catch (error) {
      console.error('Failed to add subtask:', error)
    } finally {
      setSubtaskLoading(false)
    }
  }

  const handleToggleSubtask = async (subtask: Subtask) => {
    try {
      const response = await fetch(`/api/subtasks/${subtask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !subtask.completed }),
      })

      if (response.ok) {
        const updated = await response.json()
        setSubtasks(subtasks.map((s) => (s.id === updated.id ? updated : s)))
        onSubtaskChange?.()
      }
    } catch (error) {
      console.error('Failed to toggle subtask:', error)
    }
  }

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      const response = await fetch(`/api/subtasks/${subtaskId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSubtasks(subtasks.filter((s) => s.id !== subtaskId))
        onSubtaskChange?.()
      }
    } catch (error) {
      console.error('Failed to delete subtask:', error)
    }
  }

  const completedCount = subtasks.filter((s) => s.completed).length
  const totalCount = subtasks.length

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-lg sm:mx-4 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">{task ? 'Edit Task' : 'New Task'}</h2>
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

          {/* Subtasks Section */}
          {task && (
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Subtasks
                {totalCount > 0 && (
                  <span className="ml-2 text-muted-foreground font-normal">
                    ({completedCount}/{totalCount})
                  </span>
                )}
              </label>

              <div className="space-y-1 mb-2">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-2 group px-2 py-1.5 rounded-md hover:bg-muted/50"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleSubtask(subtask)}
                      className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                    >
                      {subtask.completed ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                    <span
                      className={`flex-1 text-sm ${
                        subtask.completed ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {subtask.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(subtask.id)}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddSubtask()
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  placeholder="Add subtask..."
                  disabled={subtaskLoading}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddSubtask}
                  disabled={!newSubtaskTitle.trim() || subtaskLoading}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Due Date</label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal h-11 sm:h-10"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.dueDate ? (
                    format(formData.dueDate, 'PPP')
                  ) : (
                    <span className="text-muted-foreground">Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.dueDate || undefined}
                  onSelect={(date) => {
                    setFormData({ ...formData, dueDate: date || null })
                    setCalendarOpen(false)
                  }}
                />
              </PopoverContent>
            </Popover>
            {formData.dueDate && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-1 text-muted-foreground"
                onClick={() => setFormData({ ...formData, dueDate: null })}
              >
                <X className="h-3 w-3 mr-1" />
                Clear due date
              </Button>
            )}
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
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
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
