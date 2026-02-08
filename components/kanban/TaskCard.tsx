'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskWithRelations } from './types'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow, isBefore, isToday, addDays, startOfDay } from 'date-fns'
import { CheckSquare, CalendarIcon } from 'lucide-react'

interface TaskCardProps {
  task: TaskWithRelations
  onClick?: () => void
}

function getDueDateStatus(dueDate: Date): { color: string; label: string } {
  const now = startOfDay(new Date())
  const due = startOfDay(dueDate)
  const threeDaysFromNow = addDays(now, 3)

  if (isBefore(due, now)) {
    return { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Overdue' }
  }
  if (isToday(dueDate)) {
    return { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'Today' }
  }
  if (isBefore(due, threeDaysFromNow)) {
    return { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Soon' }
  }
  return { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', label: '' }
}

function formatDueDate(dueDate: Date): string {
  const now = startOfDay(new Date())
  const due = startOfDay(dueDate)

  if (isToday(dueDate)) {
    return 'Today'
  }
  if (isBefore(due, now)) {
    return formatDistanceToNow(dueDate, { addSuffix: true })
  }
  return formatDistanceToNow(dueDate, { addSuffix: true })
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const timeAgo = formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })
  const completedCount = task.subtasks?.filter((s) => s.completed).length ?? 0
  const totalCount = task.subtasks?.length ?? 0
  const dueDate = task.dueDate ? new Date(task.dueDate) : null
  const dueDateStatus = dueDate ? getDueDateStatus(dueDate) : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={
        `
        relative bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing
        hover:border-primary/50 transition-colors shadow-sm touch-manipulation
        ${isDragging ? 'ring-2 ring-primary' : ''}
      `
      }
    >
      {/* Labels & Source */}
      {(task.labels?.length > 0 || task.source) && (
        <div className="flex flex-wrap gap-1 mb-2">
          {/* Source badge */}
          {task.source && (
            <span
              className="px-2 py-0.5 text-xs rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
              title={`Created by: ${task.source}`}
            >
              🤖 {task.source}
            </span>
          )}
          {/* Label badges */}
          {task.labels?.map((tl) => (
            <span
              key={tl.id}
              className="px-2 py-0.5 text-xs rounded-full text-white"
              style={{ backgroundColor: tl.label.color }}
            >
              {tl.label.name}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <h3 className="font-medium text-sm mb-1 line-clamp-2">{task.title}</h3>

      {/* Description preview */}
      {task.description && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Subtasks progress */}
      {totalCount > 0 && (
        <div className="flex items-center gap-1.5 mb-2">
          <CheckSquare className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{totalCount}
          </span>
        </div>
      )}

      {/* Due Date Badge */}
      {dueDate && dueDateStatus && (
        <div className="mb-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border ${dueDateStatus.color}`}>
            <CalendarIcon className="h-3 w-3" />
            {formatDueDate(dueDate)}
          </span>
        </div>
      )}

      {/* Footer: assignee + time */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
        <div className="flex items-center gap-1">
          {task.assignee ? (
            <div className="flex items-center gap-1.5">
              {task.assignee.avatar || task.assignee.image ? (
                <img
                  src={task.assignee.avatar || task.assignee.image || ''}
                  alt={task.assignee.name}
                  className="w-5 h-5 rounded-full"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-medium">
                  {task.assignee.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs text-muted-foreground">{task.assignee.name.split(' ')[0]}</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Unassigned</span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{timeAgo}</span>
      </div>

      {/* Priority indicator */}
      {task.priority === 'HIGH' || task.priority === 'CRITICAL' ? (
        <div className="absolute -top-1 -right-1">
          <Badge variant="destructive" className="text-[10px] px-1 py-0">
            {task.priority === 'CRITICAL' ? '🔥' : '⚡'}
          </Badge>
        </div>
      ) : null}
    </div>
  )
}
