import { prisma } from "@/lib/prisma"
import { KanbanBoard } from "@/components/kanban"
import { ActivityFeed } from "@/components/kanban/ActivityFeed"
import { MobileActivityPanel } from "@/components/kanban/MobileActivityPanel"
import { TaskWithRelations } from "@/components/kanban/types"
import { requireUser } from "@/lib/admin/auth"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TasksPage() {
  const user = await requireUser()

  const [tasks, activities, projects] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId: user.id, // Multi-tenant filter
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            avatar: true,
            image: true,
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
            status: true,
          }
        },
        labels: {
          include: {
            label: true
          }
        },
        subtasks: {
          orderBy: { position: 'asc' }
        }
      },
      orderBy: [
        { position: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    }),
    prisma.activityLog.findMany({
      where: {
        task: {
          userId: user.id, // Multi-tenant filter
        }
      },
      take: 30,
      orderBy: { createdAt: 'desc' },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            image: true,
          }
        }
      }
    }),
    prisma.project.findMany({
      where: {
        userId: user.id,
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        color: true,
        icon: true,
        status: true,
      }
    })
  ])

  // Transform dates to strings for client component
  const serializedTasks: TaskWithRelations[] = tasks.map(task => ({
    ...task,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    subtasks: task.subtasks.map(subtask => ({
      ...subtask,
      createdAt: subtask.createdAt.toISOString(),
      updatedAt: subtask.updatedAt.toISOString(),
    })),
  }))

  const serializedActivities = activities.map(a => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }))

  return (
    <>
      <div className="max-w-[1800px] mx-auto px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 flex gap-4 md:gap-6">
        {/* Kanban Board */}
        <div className="flex-1 min-w-0">
          <KanbanBoard initialTasks={serializedTasks} projects={projects} />
        </div>

        {/* Activity Feed Sidebar - Desktop only */}
        <div className="w-80 shrink-0 hidden xl:block">
          <div className="sticky top-24 h-[calc(100vh-8rem)]">
            <ActivityFeed initialActivities={serializedActivities} />
          </div>
        </div>
      </div>

      {/* Mobile Activity Panel - Shows FAB + slide-up panel on mobile/tablet */}
      <MobileActivityPanel initialActivities={serializedActivities} />
    </>
  )
}
