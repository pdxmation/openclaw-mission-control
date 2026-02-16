import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/admin/auth'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const user = await requireUser()
  const { id } = await params

  const project = await prisma.project.findFirst({
    where: { id, userId: user.id },
  })

  if (!project) {
    return notFound()
  }

  const tasks = await prisma.task.findMany({
    where: { userId: user.id, projectId: project.id },
    orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      createdAt: true,
    }
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${project.color}22`, color: project.color }}
          >
            {project.icon}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">{project.description || 'No description yet.'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={project.status === 'ACTIVE' ? 'default' : 'outline'}>
            {project.status === 'ACTIVE' ? 'Active' : 'Archived'}
          </Badge>
          <Button asChild variant="outline">
            <Link href="/projects">Back to projects</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks assigned to this project yet.</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg border border-border/60 bg-background"
                >
                  <div>
                    <p className="font-medium text-sm">{task.title}</p>
                    <p className="text-xs text-muted-foreground">Created {task.createdAt.toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{task.status.replace('_', ' ')}</Badge>
                    <Badge variant="outline">{task.priority}</Badge>
                    {task.dueDate && (
                      <Badge variant="outline">Due {task.dueDate.toLocaleDateString()}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
