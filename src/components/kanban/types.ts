// Define types locally to avoid importing server-only Prisma client in client components
export type TaskStatus = 'RECURRING' | 'IN_PROGRESS' | 'BACKLOG' | 'REVIEW' | 'COMPLETED' | 'BLOCKED'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface TaskLabel {
  id: string
  label: {
    id: string
    name: string
    color: string
  }
}

export interface Subtask {
  id: string
  title: string
  completed: boolean
  position: number
  taskId: string
  createdAt: string
  updatedAt: string
}

export interface TaskWithRelations {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  isRecurring: boolean
  position: number
  assigneeId: string | null
  assignee: {
    id: string
    name: string
    avatar: string | null
    image: string | null
  } | null
  projectId: string | null
  project: {
    id: string
    name: string
    color: string
  } | null
  labels: TaskLabel[]
  subtasks: Subtask[]
  createdAt: string
  updatedAt: string
}

export interface KanbanColumn {
  id: TaskStatus
  title: string
  color: string
  tasks: TaskWithRelations[]
}

export const KANBAN_COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'RECURRING', title: 'Recurring', color: 'purple' },
  { id: 'BACKLOG', title: 'Backlog', color: 'slate' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'blue' },
  { id: 'REVIEW', title: 'Review', color: 'amber' },
  { id: 'BLOCKED', title: 'Blocked', color: 'red' },
  { id: 'COMPLETED', title: 'Completed', color: 'green' },
]
