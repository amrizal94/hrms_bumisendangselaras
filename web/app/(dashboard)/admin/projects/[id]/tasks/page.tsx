'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useProject, useTasks } from '@/hooks/use-tasks'
import { TaskFormDialog } from '@/components/tasks/task-form-dialog'
import { TaskDetailSheet } from '@/components/tasks/task-detail-sheet'
import { PriorityBadge } from '@/components/tasks/priority-badge'
import { LabelBadge } from '@/components/tasks/label-badge'
import type { Task, TaskStatus } from '@/types/task'

const COLUMNS: { key: TaskStatus; label: string; color: string }[] = [
  { key: 'todo',        label: 'To Do',       color: 'bg-slate-500' },
  { key: 'in_progress', label: 'In Progress',  color: 'bg-blue-500' },
  { key: 'done',        label: 'Done',         color: 'bg-emerald-500' },
  { key: 'cancelled',   label: 'Cancelled',    color: 'bg-red-400' },
]

function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done' && task.status !== 'cancelled'

  return (
    <div
      onClick={onClick}
      className="bg-white border rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow space-y-2"
    >
      <div className="flex items-start gap-1.5 flex-wrap">
        <p className="text-sm font-medium leading-snug line-clamp-2 flex-1">{task.title}</p>
        {task.self_reported && (
          <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium border border-amber-400 text-amber-600 bg-amber-50">
            Self-reported
          </span>
        )}
      </div>

      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.labels.map((label) => (
            <LabelBadge key={label.id} label={label} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <PriorityBadge priority={task.priority} />
        {task.deadline && (
          <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
            {new Date(task.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>

      {(task.checklist_total ?? 0) > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>☑</span>
          <span>{task.checklist_done}/{task.checklist_total}</span>
        </div>
      )}

      {task.assignee && (
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-xs shrink-0">
            {task.assignee.user.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-muted-foreground truncate">{task.assignee.user.name}</span>
        </div>
      )}
    </div>
  )
}

export default function ProjectTasksPage() {
  const params    = useParams<{ id: string }>()
  const router    = useRouter()
  const projectId = parseInt(params.id)

  const [newTaskOpen, setNewTaskOpen]   = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [detailOpen, setDetailOpen]     = useState(false)

  const { data: project }               = useProject(projectId)
  const { data: tasksData, isLoading }  = useTasks({ project_id: projectId, per_page: 100 })

  const tasks = tasksData?.data ?? []

  function openTask(taskId: number) {
    setSelectedTaskId(taskId)
    setDetailOpen(true)
  }

  return (
    <DashboardLayout title={project?.name ?? 'Tasks'} allowedRoles={['admin', 'hr', 'manager', 'director']}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/projects')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Projects
          </Button>
          <Button onClick={() => setNewTaskOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Task
          </Button>
        </div>

        {/* Kanban columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key)
            return (
              <div key={col.key} className="flex flex-col min-h-[200px]">
                <Card className="flex-1">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${col.color}`} />
                      {col.label}
                      <span className="ml-auto text-muted-foreground font-normal text-xs">
                        {colTasks.length}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 space-y-2">
                    {isLoading ? (
                      <p className="text-xs text-muted-foreground text-center py-4">Loading…</p>
                    ) : colTasks.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No tasks</p>
                    ) : (
                      colTasks.map((task) => (
                        <TaskCard key={task.id} task={task} onClick={() => openTask(task.id)} />
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      </div>

      <TaskFormDialog
        open={newTaskOpen}
        onOpenChange={setNewTaskOpen}
        defaultProjectId={projectId}
      />

      <TaskDetailSheet
        taskId={selectedTaskId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        isAdmin
      />
    </DashboardLayout>
  )
}
