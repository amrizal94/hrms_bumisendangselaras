'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Pencil, Trash2, Calendar, User, FolderKanban, Camera, FileText, MapPin, Clock, CheckCircle2 } from 'lucide-react'

const LocationMap = dynamic(() => import('@/components/ui/location-map'), { ssr: false })
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { useDeleteTask, useTask, useUpdateTask } from '@/hooks/use-tasks'
import { ChecklistPanel } from './checklist-panel'
import { LabelBadge } from './label-badge'
import { PriorityBadge } from './priority-badge'
import { TaskFormDialog } from './task-form-dialog'

interface TaskDetailSheetProps {
  taskId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isAdmin?: boolean
}

export function TaskDetailSheet({ taskId, open, onOpenChange, isAdmin = false }: TaskDetailSheetProps) {
  const [editOpen, setEditOpen]   = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: task, isLoading } = useTask(taskId ?? 0)
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  function handleStatusChange(status: string) {
    if (!task) return
    updateTask.mutate({ id: task.id, data: { status: status as 'todo' | 'in_progress' | 'done' | 'cancelled' } })
  }

  function handleDelete() {
    if (!task) return
    deleteTask.mutate(task.id, {
      onSuccess: () => { setDeleteOpen(false); onOpenChange(false) },
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-2 pr-6">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base leading-snug">
                  {isLoading ? 'Loading…' : task?.title}
                </DialogTitle>
                {task?.self_reported && (
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-xs font-medium border border-amber-400 text-amber-600 bg-amber-50">
                    <Camera className="h-3 w-3" />
                    Self-reported
                  </span>
                )}
              </div>
              {isAdmin && task && (
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditOpen(true)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>

          {task && (
            <div className="space-y-5">
              {/* Status selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-20">Status</span>
                <Select value={task.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="h-8 w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Meta */}
              <div className="space-y-2 text-sm">
                {task.project && (
                  <div className="flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Project</span>
                    <span className="ml-auto font-medium">{task.project.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-20">Priority</span>
                  <PriorityBadge priority={task.priority} />
                </div>
                {task.deadline && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Deadline</span>
                    <span className="ml-auto">
                      {new Date(task.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                )}
                {task.assignee && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Assignee</span>
                    <span className="ml-auto">{task.assignee.user.name}</span>
                  </div>
                )}
                {task.created_at && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Dilaporkan</span>
                    <span className="ml-auto">
                      {new Date(task.created_at).toLocaleString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
                {task.completed_at && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="text-muted-foreground">Diselesaikan</span>
                    <span className="ml-auto text-green-700 font-medium">
                      {new Date(task.completed_at).toLocaleString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              {task.description && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</p>
                  <p className="text-sm whitespace-pre-wrap">{task.description}</p>
                </div>
              )}

              {/* Labels */}
              {task.labels && task.labels.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Labels</p>
                  <div className="flex flex-wrap gap-1.5">
                    {task.labels.map((label) => (
                      <LabelBadge key={label.id} label={label} />
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {task.notes && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Catatan
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{task.notes}</p>
                </div>
              )}

              {/* Photo proof */}
              {task.photo_url && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Camera className="h-3 w-3" /> Foto Bukti
                  </p>
                  <a href={task.photo_url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={task.photo_url}
                      alt="Foto bukti"
                      className="rounded-md max-h-48 object-cover border hover:opacity-90 transition-opacity cursor-pointer"
                    />
                  </a>
                </div>
              )}

              {/* GPS Audit */}
              {(task.created_gps || task.completed_gps) && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Audit Lokasi
                  </p>

                  {task.created_gps && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium">📍 Dibuat</span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {task.created_gps.lat.toFixed(6)}, {task.created_gps.lng.toFixed(6)}
                        </span>
                        {task.created_gps.face_confidence != null && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-green-300 text-green-700 bg-green-50 text-xs font-medium">
                            Wajah {task.created_gps.face_confidence.toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <LocationMap
                        lat={task.created_gps.lat}
                        lng={task.created_gps.lng}
                        label="Lokasi submit tugas"
                        height={180}
                      />
                    </div>
                  )}

                  {task.completed_gps && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium">✅ Diselesaikan</span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {task.completed_gps.lat.toFixed(6)}, {task.completed_gps.lng.toFixed(6)}
                        </span>
                        {task.completed_gps.is_mock && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-red-300 text-red-700 bg-red-50 text-xs font-medium">
                            ⚠️ GPS Palsu!
                          </span>
                        )}
                        {task.completed_gps.face_confidence != null && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-green-300 text-green-700 bg-green-50 text-xs font-medium">
                            Wajah {task.completed_gps.face_confidence.toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <LocationMap
                        lat={task.completed_gps.lat}
                        lng={task.completed_gps.lng}
                        accuracy={task.completed_gps.accuracy}
                        isMock={task.completed_gps.is_mock}
                        label="Lokasi selesai tugas"
                        height={180}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Checklist */}
              {task.checklist_items && task.checklist_items.length > 0 || isAdmin ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Checklist
                    {task.checklist_items && task.checklist_items.length > 0 && (
                      <span className="ml-2 text-foreground">
                        {task.checklist_items.filter((i) => i.is_done).length}/{task.checklist_items.length}
                      </span>
                    )}
                  </p>
                  <ChecklistPanel
                    taskId={task.id}
                    items={task.checklist_items ?? []}
                    isAdmin={isAdmin}
                  />
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {task && (
        <TaskFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          task={task}
        />
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The task will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
