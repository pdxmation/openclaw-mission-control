'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TaskWithRelations } from './types'
import { TaskCard } from './TaskCard'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TaskStatus } from './types'

interface KanbanColumnProps {
  id: TaskStatus
  title: string
  color: string
  tasks: TaskWithRelations[]
  onTaskClick?: (task: TaskWithRelations) => void
  onAddTask?: (status: TaskStatus) => void
}

const colorMap: Record<string, string> = {
  purple: 'border-purple-500/50 bg-purple-500/5',
  slate: 'border-slate-500/50 bg-slate-500/5',
  blue: 'border-blue-500/50 bg-blue-500/5',
  amber: 'border-amber-500/50 bg-amber-500/5',
  red: 'border-red-500/50 bg-red-500/5',
  green: 'border-green-500/50 bg-green-500/5',
}

const headerColorMap: Record<string, string> = {
  purple: 'text-purple-400',
  slate: 'text-slate-400',
  blue: 'text-blue-400',
  amber: 'text-amber-400',
  red: 'text-red-400',
  green: 'text-green-400',
}

export function KanbanColumn({
  id,
  title,
  color,
  tasks,
  onTaskClick,
  onAddTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col w-[85vw] sm:w-[300px] md:min-w-[280px] md:max-w-[320px] md:w-auto
        shrink-0 snap-center md:snap-align-none
        rounded-xl border-2
        ${colorMap[color] || colorMap.slate}
        ${isOver ? 'ring-2 ring-primary' : ''}
        transition-all
      `}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <h2 className={`font-semibold text-sm ${headerColorMap[color] || ''}`}>
            {title}
          </h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        {onAddTask && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 sm:h-6 sm:w-6 p-0 touch-manipulation"
            onClick={() => onAddTask(id)}
          >
            <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
        )}
      </div>

      {/* Tasks Container */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-320px)] sm:max-h-[calc(100vh-280px)]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick?.(task)}
            />
          ))}
        </SortableContext>
        
        {tasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No tasks
          </div>
        )}
      </div>
    </div>
  )
}
