'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProjectModal, ProjectFormData, ProjectStatus } from './ProjectModal'
import { Pencil, Archive, Plus, RotateCcw } from 'lucide-react'

export interface ProjectWithCount {
  id: string
  name: string
  description: string | null
  color: string
  icon: string
  status: ProjectStatus
  createdAt: string
  updatedAt: string
  _count?: {
    tasks: number
  }
}

interface ProjectsViewProps {
  initialProjects: ProjectWithCount[]
}

export function ProjectsView({ initialProjects }: ProjectsViewProps) {
  const [projects, setProjects] = useState<ProjectWithCount[]>(initialProjects)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectWithCount | null>(null)

  const activeProjects = useMemo(
    () => projects.filter((project) => project.status === 'ACTIVE'),
    [projects]
  )
  const archivedProjects = useMemo(
    () => projects.filter((project) => project.status === 'ARCHIVED'),
    [projects]
  )

  const openCreateModal = () => {
    setEditingProject(null)
    setModalOpen(true)
  }

  const openEditModal = (project: ProjectWithCount) => {
    setEditingProject(project)
    setModalOpen(true)
  }

  const handleSave = async (data: ProjectFormData) => {
    const payload = {
      ...data,
      description: data.description || null,
    }

    if (editingProject) {
      const res = await fetch(`/api/projects/${editingProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        console.error('Failed to update project')
        return
      }
      const updated = await res.json()
      setProjects((prev) => prev.map((project) => (project.id === updated.id ? updated : project)))
      setEditingProject(null)
      return
    }

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      console.error('Failed to create project')
      return
    }
    const created = await res.json()
    setProjects((prev) => [created, ...prev])
  }

  const handleArchive = async (projectId: string) => {
    if (!confirm('Archive this project?')) return
    const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
    if (!res.ok) {
      console.error('Failed to archive project')
      return
    }
    const updated = await res.json()
    setProjects((prev) => prev.map((project) => (project.id === updated.id ? updated : project)))
  }

  const handleRestore = async (projectId: string) => {
    const res = await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ACTIVE' }),
    })
    if (!res.ok) {
      console.error('Failed to restore project')
      return
    }
    const updated = await res.json()
    setProjects((prev) => prev.map((project) => (project.id === updated.id ? updated : project)))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Organize tasks by initiative</p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Active</h2>
        {activeProjects.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No active projects yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeProjects.map((project) => (
              <Card key={project.id} className="group hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/projects/${project.id}`} className="flex-1 min-w-0">
                      <CardTitle className="flex items-center gap-3 text-base">
                        <span
                          className="h-10 w-10 rounded-xl flex items-center justify-center text-lg"
                          style={{ backgroundColor: `${project.color}22`, color: project.color }}
                        >
                          {project.icon}
                        </span>
                        <span className="truncate">{project.name}</span>
                      </CardTitle>
                    </Link>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(project)}
                        className="opacity-80 hover:opacity-100"
                        title="Edit project"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleArchive(project.id)}
                        className="opacity-80 hover:opacity-100"
                        title="Archive project"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {project.description ? (
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No description yet.</p>
                  )}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">
                      {project._count?.tasks ?? 0} tasks
                    </Badge>
                    <span className="text-xs text-muted-foreground">Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {archivedProjects.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Archived</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivedProjects.map((project) => (
              <Card key={project.id} className="opacity-80">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="flex items-center gap-3 text-base">
                      <span
                        className="h-10 w-10 rounded-xl flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${project.color}22`, color: project.color }}
                      >
                        {project.icon}
                      </span>
                      <span className="truncate">{project.name}</span>
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRestore(project.id)}
                      title="Restore project"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {project.description ? (
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No description yet.</p>
                  )}
                  <Badge variant="outline">{project._count?.tasks ?? 0} tasks</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <ProjectModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingProject(null)
        }}
        onSave={handleSave}
        project={editingProject}
      />
    </div>
  )
}
