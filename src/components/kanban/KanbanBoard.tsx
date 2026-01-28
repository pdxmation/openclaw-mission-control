'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { TaskWithRelations, KANBAN_COLUMNS, TaskStatus } from './types'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'
import { TaskModal, TaskFormData } from './TaskModal'
import { StatsBar } from './StatsBar'
import { FilterBar } from './FilterBar'
import { SearchBar } from './SearchBar'

interface User {
  id: string
  name: string
  avatar: string | null
}

interface Project {
  id: string
  name: string
  color: string
}

interface KanbanBoardProps {
  initialTasks: TaskWithRelations[]
  users?: User[]
  projects?: Project[]
}

export function KanbanBoard({ initialTasks, users = [], projects = [] }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<TaskWithRelations[]>(initialTasks)
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('BACKLOG')
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  
  // Filters
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  
  // Track if drag is in progress to prevent refresh during drag
  const isDragging = useRef(false)

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const fetchTasks = async () => {
      // Don't refresh while dragging
      if (isDragging.current) return
      
      try {
        const res = await fetch('/api/tasks')
        if (res.ok) {
          const data = await res.json()
          // Transform dates to strings for consistency
          const refreshedTasks: TaskWithRelations[] = data.all.map((task: any) => ({
            ...task,
            createdAt: typeof task.createdAt === 'string' ? task.createdAt : new Date(task.createdAt).toISOString(),
            updatedAt: typeof task.updatedAt === 'string' ? task.updatedAt : new Date(task.updatedAt).toISOString(),
          }))
          setTasks(refreshedTasks)
          setLastRefresh(new Date())
        }
      } catch (error) {
        console.error('Auto-refresh failed:', error)
      }
    }

    // Initial fetch after mount
    const initialTimeout = setTimeout(fetchTasks, 1000)
    
    // Then every 60 seconds
    const interval = setInterval(fetchTasks, 60000)
    
    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Extract unique assignees and projects from tasks if not provided
  const assigneeOptions = useMemo(() => {
    if (users.length > 0) return users
    const seen = new Set<string>()
    return tasks
      .filter((t) => t.assignee && !seen.has(t.assignee.id) && seen.add(t.assignee.id))
      .map((t) => ({
        id: t.assignee!.id,
        name: t.assignee!.name,
        avatar: t.assignee!.avatar || t.assignee!.image,
      }))
  }, [tasks, users])

  const projectOptions = useMemo(() => {
    if (projects.length > 0) return projects
    const seen = new Set<string>()
    return tasks
      .filter((t) => t.project && !seen.has(t.project.id) && seen.add(t.project.id))
      .map((t) => ({
        id: t.project!.id,
        name: t.project!.name,
        color: t.project!.color,
      }))
  }, [tasks, projects])

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedAssignee && t.assigneeId !== selectedAssignee) return false
      if (selectedProject && t.projectId !== selectedProject) return false
      return true
    })
  }, [tasks, selectedAssignee, selectedProject])

  const getTasksByStatus = useCallback(
    (status: TaskStatus) => {
      return filteredTasks
        .filter((t) => t.status === status)
        .sort((a, b) => a.position - b.position)
    },
    [filteredTasks]
  )

  const handleDragStart = (event: DragStartEvent) => {
    isDragging.current = true
    const task = tasks.find((t) => t.id === event.active.id)
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTask = tasks.find((t) => t.id === activeId)
    if (!activeTask) return

    // Check if dropped over a column
    const overColumn = KANBAN_COLUMNS.find((c) => c.id === overId)
    if (overColumn && activeTask.status !== overColumn.id) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: overColumn.id } : t
        )
      )
      return
    }

    // Check if dropped over another task
    const overTask = tasks.find((t) => t.id === overId)
    if (overTask && activeTask.status !== overTask.status) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: overTask.status } : t
        )
      )
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    isDragging.current = false
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = active.id as string
    const task = tasks.find((t) => t.id === activeId)
    if (!task) return

    // Determine final status
    let newStatus = task.status
    const overColumn = KANBAN_COLUMNS.find((c) => c.id === over.id)
    if (overColumn) {
      newStatus = overColumn.id
    } else {
      const overTask = tasks.find((t) => t.id === over.id)
      if (overTask) {
        newStatus = overTask.status
      }
    }

    // Update in database
    try {
      await fetch(`/api/tasks/${activeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
    } catch (error) {
      console.error('Failed to update task:', error)
      // Revert on error
      setTasks(initialTasks)
    }
  }

  const handleTaskClick = (task: TaskWithRelations) => {
    setEditingTask(task)
    setModalOpen(true)
  }

  const handleSearchSelect = async (taskId: string) => {
    // First check if task is in current state
    let task = tasks.find((t) => t.id === taskId)
    
    if (!task) {
      // Fetch the task if not in state
      try {
        const res = await fetch(`/api/tasks/${taskId}`)
        if (res.ok) {
          task = await res.json()
        }
      } catch (error) {
        console.error('Failed to fetch task:', error)
        return
      }
    }
    
    if (task) {
      setEditingTask(task)
      setModalOpen(true)
    }
  }

  const handleAddTask = (status: TaskStatus) => {
    setEditingTask(null)
    setDefaultStatus(status)
    setModalOpen(true)
  }

  const handleSaveTask = async (data: TaskFormData) => {
    try {
      if (editingTask) {
        // Update existing task
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const updated = await res.json()
        setTasks((prev) =>
          prev.map((t) =>
            t.id === editingTask.id ? { ...t, ...updated } : t
          )
        )
      } else {
        // Create new task
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const created = await res.json()
        setTasks((prev) => [...prev, { ...created, labels: [], assignee: null, project: null }])
      }
    } catch (error) {
      console.error('Failed to save task:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  const handleManualRefresh = async () => {
    if (isDragging.current) return
    try {
      const res = await fetch('/api/tasks')
      if (res.ok) {
        const data = await res.json()
        const refreshedTasks: TaskWithRelations[] = data.all.map((task: any) => ({
          ...task,
          createdAt: typeof task.createdAt === 'string' ? task.createdAt : new Date(task.createdAt).toISOString(),
          updatedAt: typeof task.updatedAt === 'string' ? task.updatedAt : new Date(task.updatedAt).toISOString(),
        }))
        setTasks(refreshedTasks)
        setLastRefresh(new Date())
      }
    } catch (error) {
      console.error('Manual refresh failed:', error)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats Bar with refresh indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <StatsBar tasks={tasks} />
        <div className="flex items-center justify-end gap-2 text-xs text-gray-500">
          <span className="hidden sm:inline">Updated {lastRefresh.toLocaleTimeString()}</span>
          <span className="sm:hidden">{lastRefresh.toLocaleTimeString()}</span>
          <button
            onClick={handleManualRefresh}
            className="p-2 sm:p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors touch-manipulation"
            title="Refresh now"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M16 21h5v-5"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <SearchBar onSelectTask={handleSearchSelect} />
        <div className="h-6 w-px bg-border hidden sm:block" />
        <FilterBar
          assignees={assigneeOptions}
          projects={projectOptions}
          selectedAssignee={selectedAssignee}
          selectedProject={selectedProject}
          onAssigneeChange={setSelectedAssignee}
          onProjectChange={setSelectedProject}
        />
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 -mx-3 px-3 sm:-mx-4 sm:px-4 md:mx-0 md:px-1 snap-x snap-mandatory md:snap-none">
          {KANBAN_COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              tasks={getTasksByStatus(column.id)}
              onTaskClick={handleTaskClick}
              onAddTask={handleAddTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="rotate-3 opacity-90">
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingTask(null)
        }}
        task={editingTask}
        defaultStatus={defaultStatus}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />
    </div>
  )
}
