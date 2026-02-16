import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/admin/auth'
import { ProjectsView, ProjectWithCount } from '@/components/projects/ProjectsView'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProjectsPage() {
  const user = await requireUser()

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    include: {
      _count: { select: { tasks: true } }
    }
  })

  const serializedProjects: ProjectWithCount[] = projects.map((project) => ({
    ...project,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  }))

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6">
      <ProjectsView initialProjects={serializedProjects} />
    </div>
  )
}
