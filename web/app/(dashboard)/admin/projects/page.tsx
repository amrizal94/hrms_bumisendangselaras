'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Pencil, Trash2, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useDeleteProject, useProjects } from '@/hooks/use-tasks'
import { ProjectFormDialog } from '@/components/tasks/project-form-dialog'
import type { Project, ProjectFilters } from '@/types/task'

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  active:    { label: 'Active',    className: 'bg-emerald-100 text-emerald-700' },
  completed: { label: 'Completed', className: 'bg-blue-100 text-blue-700' },
  archived:  { label: 'Archived',  className: 'bg-slate-100 text-slate-500' },
}

export default function AdminProjectsPage() {
  const router = useRouter()
  const [filters, setFilters]             = useState<ProjectFilters>({ page: 1, per_page: 15 })
  const [search, setSearch]               = useState('')
  const [formOpen, setFormOpen]           = useState(false)
  const [editTarget, setEditTarget]       = useState<Project | null>(null)
  const [deleteTarget, setDeleteTarget]   = useState<Project | null>(null)

  const { data, isLoading } = useProjects(filters)
  const deleteProject       = useDeleteProject()

  const projects = data?.data ?? []
  const meta     = data?.meta

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setFilters((f) => ({ ...f, search: search.trim() || undefined, page: 1 }))
  }

  function openEdit(project: Project) {
    setEditTarget(project)
    setFormOpen(true)
  }

  function closeForm(open: boolean) {
    setFormOpen(open)
    if (!open) setEditTarget(null)
  }

  return (
    <DashboardLayout title="Projects" allowedRoles={['admin', 'hr', 'manager', 'director']}>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Search projects…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-52"
              />
              <Button type="submit" variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            <Select
              value={filters.status ?? 'all'}
              onValueChange={(v) => setFilters((f) => ({ ...f, status: v === 'all' ? undefined : v, page: 1 }))}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => { setEditTarget(null); setFormOpen(true) }}>
            <Plus className="h-4 w-4 mr-1" /> New Project
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead className="text-center">Tasks</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : projects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      No projects found.
                    </TableCell>
                  </TableRow>
                ) : (
                  projects.map((project) => {
                    const statusStyle = STATUS_STYLES[project.status] ?? STATUS_STYLES.active
                    return (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.className}`}>
                            {statusStyle.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 w-32">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-8">{project.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {project.deadline
                            ? new Date(project.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-center">{project.task_count}</TableCell>
                        <TableCell className="text-sm">{project.creator?.name ?? '—'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => router.push(`/admin/projects/${project.id}/tasks`)}
                              title="View Tasks"
                            >
                              <FolderOpen className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(project)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => setDeleteTarget(project)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {meta.current_page} of {meta.last_page} ({meta.total} projects)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.current_page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.current_page >= meta.last_page}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <ProjectFormDialog open={formOpen} onOpenChange={closeForm} project={editTarget} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting &ldquo;{deleteTarget?.name}&rdquo; will also remove all its tasks. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  deleteProject.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
