'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskWithRelations } from './types'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

interface TaskCardProps {
  task: TaskWithRelations
  onClick?: () => void
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        relative bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing
        hover:border-primary/50 transition-colors shadow-sm touch-manipulation
        ${isDragging ? 'ring-2 ring-primary' : ''}
      `}
    >
      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.map((tl) => (
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
