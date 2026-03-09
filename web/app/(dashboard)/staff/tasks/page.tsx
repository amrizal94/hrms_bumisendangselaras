'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useTasks } from '@/hooks/use-tasks'
import { TaskDetailSheet } from '@/components/tasks/task-detail-sheet'
import { PriorityBadge } from '@/components/tasks/priority-badge'
import { StatusBadge } from '@/components/tasks/status-badge'
import { LabelBadge } from '@/components/tasks/label-badge'
import type { TaskFilters } from '@/types/task'

const PRIORITY_BAR: Record<string, string> = {
  low:    'bg-slate-400',
  medium: 'bg-blue-500',
  high:   'bg-orange-500',
  urgent: 'bg-red-600',
}

export default function StaffTasksPage() {
  const [filters, setFilters]           = useState<TaskFilters>({ per_page: 50 })
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [detailOpen, setDetailOpen]     = useState(false)

  const { data, isLoading } = useTasks(filters)
  const tasks = data?.data ?? []

  function openTask(id: number) {
    setSelectedTaskId(id)
    setDetailOpen(true)
  }

  return (
    <DashboardLayout title="My Tasks" allowedRoles={['staff']}>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Select
            value={filters.status ?? 'all'}
            onValueChange={(v) => setFilters((f) => ({ ...f, status: v === 'all' ? undefined : v }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.priority ?? 'all'}
            onValueChange={(v) => setFilters((f) => ({ ...f, priority: v === 'all' ? undefined : v }))}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Task list */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading tasks…</p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No tasks assigned to you.</p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => {
              const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done' && task.status !== 'cancelled'
              return (
                <Card
                  key={task.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => openTask(task.id)}
                >
                  <CardContent className="p-0 flex">
                    {/* Priority bar */}
                    <div className={`w-1 rounded-l-xl shrink-0 ${PRIORITY_BAR[task.priority] ?? 'bg-slate-400'}`} />
                    <div className="flex-1 p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 flex items-start gap-1.5 flex-wrap">
                          <p className="font-medium text-sm leading-snug">{task.title}</p>
                          {task.self_reported && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium border border-amber-400 text-amber-600 bg-amber-50">
                              Saya buat
                            </span>
                          )}
                        </div>
                        <StatusBadge status={task.status} className="shrink-0" />
                      </div>

                      {task.project && (
                        <p className="text-xs text-muted-foreground">{task.project.name}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        <PriorityBadge priority={task.priority} />
                        {task.labels?.map((label) => (
                          <LabelBadge key={label.id} label={label} />
                        ))}
                        {task.deadline && (
                          <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                            <Calendar className="h-3 w-3" />
                            {new Date(task.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                        {(task.checklist_total ?? 0) > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ☑ {task.checklist_done}/{task.checklist_total}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <TaskDetailSheet
        taskId={selectedTaskId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        isAdmin={false}
      />
    </DashboardLayout>
  )
}
