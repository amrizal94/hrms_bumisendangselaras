'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Megaphone } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  useAnnouncements,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
} from '@/hooks/use-announcements'
import type { Announcement, AnnouncementCategory, CreateAnnouncementData } from '@/types/announcement'

// ── Styling constants ─────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<AnnouncementCategory, { label: string; cls: string }> = {
  general: { label: 'General', cls: 'bg-slate-100 text-slate-600' },
  hr:      { label: 'HR',      cls: 'bg-blue-100 text-blue-700' },
  policy:  { label: 'Policy',  cls: 'bg-purple-100 text-purple-700' },
  event:   { label: 'Event',   cls: 'bg-emerald-100 text-emerald-700' },
}

const PRIORITY_COLORS = {
  low:    'bg-green-500',
  medium: 'bg-amber-500',
  high:   'bg-red-500',
}

const TARGET_LABELS = {
  all:      'All Users',
  staff:    'Staff Only',
  admin_hr: 'Admin & HR',
}

// ── Filter chip type ──────────────────────────────────────────────────────────

type FilterType = 'all' | AnnouncementCategory

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all',     label: 'All' },
  { key: 'general', label: 'General' },
  { key: 'hr',      label: 'HR' },
  { key: 'policy',  label: 'Policy' },
  { key: 'event',   label: 'Event' },
]

// ── Date formatter ────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ── Announcement Form Dialog ──────────────────────────────────────────────────

interface FormDialogProps {
  open: boolean
  initial?: Announcement
  onClose: () => void
}

function AnnouncementFormDialog({ open, initial, onClose }: FormDialogProps) {
  const create = useCreateAnnouncement()
  const update = useUpdateAnnouncement()

  const [form, setForm] = useState<CreateAnnouncementData>({
    title:        initial?.title        ?? '',
    content:      initial?.content      ?? '',
    category:     initial?.category     ?? 'general',
    priority:     initial?.priority     ?? 'medium',
    target_roles: initial?.target_roles ?? 'all',
  })

  if (!open) return null

  const isPending = create.isPending || update.isPending

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (initial) {
      update.mutate({ id: initial.id, data: form }, { onSuccess: onClose })
    } else {
      create.mutate(form, { onSuccess: onClose })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
        <h2 className="text-lg font-semibold mb-4">
          {initial ? 'Edit Announcement' : 'New Announcement'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Title</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Content</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm"
              rows={5}
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as AnnouncementCategory }))}
              >
                <option value="general">General</option>
                <option value="hr">HR</option>
                <option value="policy">Policy</option>
                <option value="event">Event</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Priority</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value as CreateAnnouncementData['priority'] }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Target</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.target_roles}
                onChange={e => setForm(f => ({ ...f, target_roles: e.target.value as CreateAnnouncementData['target_roles'] }))}
              >
                <option value="all">All Users</option>
                <option value="staff">Staff Only</option>
                <option value="admin_hr">Admin & HR</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : initial ? 'Update' : 'Publish'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Delete Confirm Dialog ─────────────────────────────────────────────────────

interface DeleteDialogProps {
  open: boolean
  title: string
  onConfirm: () => void
  onClose: () => void
  isPending: boolean
}

function DeleteDialog({ open, title, onConfirm, onClose, isPending }: DeleteDialogProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-semibold mb-2">Delete Announcement</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Are you sure you want to delete &quot;{title}&quot;? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminAnnouncementsPage() {
  const [filter, setFilter]         = useState<FilterType>('all')
  const [formOpen, setFormOpen]     = useState(false)
  const [editItem, setEditItem]     = useState<Announcement | undefined>()
  const [deleteItem, setDeleteItem] = useState<Announcement | undefined>()

  const { data: announcements = [], isLoading } = useAnnouncements(
    filter !== 'all' ? { category: filter } : undefined
  )
  const deleteMutation = useDeleteAnnouncement()

  function openCreate() {
    setEditItem(undefined)
    setFormOpen(true)
  }

  function openEdit(a: Announcement) {
    setEditItem(a)
    setFormOpen(true)
  }

  function handleDelete() {
    if (!deleteItem) return
    deleteMutation.mutate(deleteItem.id, {
      onSuccess: () => setDeleteItem(undefined),
    })
  }

  return (
    <DashboardLayout title="Announcements" allowedRoles={['admin', 'hr', 'manager', 'director']}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted-foreground">
          Broadcast announcements to employees
        </p>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="w-4 h-4" /> New Announcement
        </Button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              filter === f.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Card list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="py-20 text-center">
          <Megaphone className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No announcements yet.</p>
          <Button variant="outline" className="mt-4" onClick={openCreate}>
            Create your first announcement
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => {
            const cat = CATEGORY_STYLES[a.category]
            return (
              <div
                key={a.id}
                className="relative rounded-xl border bg-card overflow-hidden flex"
              >
                {/* Priority color strip */}
                <div className={`w-1.5 shrink-0 ${PRIORITY_COLORS[a.priority]}`} />

                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-sm">{a.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.cls}`}>
                          {cat.label}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {TARGET_LABELS[a.target_roles]}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{a.content}</p>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(a)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteItem(a)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {a.created_by && <span>{a.created_by} · </span>}
                    {fmtDate(a.created_at)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Form Dialog */}
      <AnnouncementFormDialog
        open={formOpen}
        initial={editItem}
        onClose={() => {
          setFormOpen(false)
          setEditItem(undefined)
        }}
      />

      {/* Delete Dialog */}
      <DeleteDialog
        open={!!deleteItem}
        title={deleteItem?.title ?? ''}
        onConfirm={handleDelete}
        onClose={() => setDeleteItem(undefined)}
        isPending={deleteMutation.isPending}
      />
    </DashboardLayout>
  )
}
