'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Video, MapPin, Users, Check, X } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  useMeetings,
  useCreateMeeting,
  useUpdateMeeting,
  useDeleteMeeting,
  useMeetingRsvps,
} from '@/hooks/use-meetings'
import type { Meeting, CreateMeetingData } from '@/types/meeting'

// ── Helpers ───────────────────────────────────────────────────────────────────

const TARGET_LABELS: Record<string, string> = {
  all:      'All Users',
  staff:    'Staff Only',
  admin_hr: 'Admin & HR',
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function isUpcoming(dateStr: string) {
  return new Date(dateStr + 'T00:00:00') >= new Date(new Date().toDateString())
}

// ── Filter ───────────────────────────────────────────────────────────────────

type Filter = 'all' | 'upcoming' | 'past'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',      label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past',     label: 'Past' },
]

// ── Form Dialog ───────────────────────────────────────────────────────────────

interface FormDialogProps {
  open: boolean
  initial?: Meeting
  onClose: () => void
}

function MeetingFormDialog({ open, initial, onClose }: FormDialogProps) {
  const create = useCreateMeeting()
  const update = useUpdateMeeting()

  const [form, setForm] = useState<CreateMeetingData>({
    title:        initial?.title        ?? '',
    description:  initial?.description  ?? '',
    meeting_date: initial?.meeting_date ?? '',
    start_time:   initial?.start_time   ?? '',
    end_time:     initial?.end_time     ?? '',
    location:     initial?.location     ?? '',
    meeting_url:  initial?.meeting_url  ?? '',
    target_roles: initial?.target_roles ?? 'all',
  })

  if (!open) return null
  const isPending = create.isPending || update.isPending

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      ...form,
      description: form.description || undefined,
      location:    form.location    || undefined,
      meeting_url: form.meeting_url || undefined,
    }
    if (initial) {
      update.mutate({ id: initial.id, data: payload }, { onSuccess: onClose })
    } else {
      create.mutate(payload, { onSuccess: onClose })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-lg font-semibold mb-4">
          {initial ? 'Edit Meeting' : 'New Meeting'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Title *</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm"
              rows={3}
              value={form.description ?? ''}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Date *</label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.meeting_date}
                onChange={e => setForm(f => ({ ...f, meeting_date: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Start *</label>
              <input
                type="time"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.start_time}
                onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">End *</label>
              <input
                type="time"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.end_time}
                onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                required
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Location</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. Meeting Room A"
              value={form.location ?? ''}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Video Conference URL</label>
            <input
              type="url"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="https://meet.google.com/..."
              value={form.meeting_url ?? ''}
              onChange={e => setForm(f => ({ ...f, meeting_url: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Target</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.target_roles}
              onChange={e => setForm(f => ({ ...f, target_roles: e.target.value as CreateMeetingData['target_roles'] }))}
            >
              <option value="all">All Users</option>
              <option value="staff">Staff Only</option>
              <option value="admin_hr">Admin & HR</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : initial ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Delete Dialog ─────────────────────────────────────────────────────────────

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
        <h2 className="text-lg font-semibold mb-2">Delete Meeting</h2>
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

// ── RSVP List Dialog ──────────────────────────────────────────────────────────

function RsvpListDialog({ meetingId, title, onClose }: { meetingId: number; title: string; onClose: () => void }) {
  const { data, isLoading } = useMeetingRsvps(meetingId)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-semibold mb-1">RSVPs</h2>
        <p className="text-xs text-muted-foreground mb-4">{title}</p>
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : data ? (
          <>
            <div className="flex gap-4 mb-4 text-sm">
              <span className="text-green-600 font-medium">✓ {data.counts.accepted} accepted</span>
              <span className="text-red-600 font-medium">✗ {data.counts.declined} declined</span>
              <span className="text-muted-foreground">{data.counts.total} total</span>
            </div>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {data.rsvps.map(r => (
                <div key={r.user_id} className="flex items-center justify-between py-1.5 text-sm border-b last:border-0">
                  <span>{r.name}</span>
                  <span className={cn('text-xs font-medium', r.status === 'accepted' ? 'text-green-600' : 'text-red-600')}>
                    {r.status === 'accepted' ? '✓ Accepted' : '✗ Declined'}
                  </span>
                </div>
              ))}
              {data.rsvps.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No RSVPs yet.</p>
              )}
            </div>
          </>
        ) : null}
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}

// ── Meeting Card ──────────────────────────────────────────────────────────────

interface MeetingCardProps {
  meeting: Meeting
  onEdit: () => void
  onDelete: () => void
  onViewRsvps: () => void
}

function MeetingCard({ meeting, onEdit, onDelete, onViewRsvps }: MeetingCardProps) {
  const upcoming = isUpcoming(meeting.meeting_date)
  const counts = meeting.rsvp_counts ?? { accepted: 0, declined: 0, total: 0 }

  return (
    <div className="relative rounded-xl border bg-card overflow-hidden flex">
      <div className={cn('w-1.5 shrink-0', upcoming ? 'bg-blue-500' : 'bg-slate-300')} />
      <div className="flex-1 p-5">
        <div className="flex items-start gap-4">
          {/* Date badge */}
          <div className={cn(
            'rounded-xl flex flex-col items-center justify-center w-14 h-14 shrink-0',
            upcoming ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
          )}>
            <span className="text-xl font-bold leading-none">
              {new Date(meeting.meeting_date + 'T00:00:00').getDate()}
            </span>
            <span className="text-xs font-medium">
              {new Date(meeting.meeting_date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short' })}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-sm">{meeting.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {meeting.start_time.slice(0, 5)} – {meeting.end_time.slice(0, 5)}
                  {' · '}
                  {fmtDate(meeting.meeting_date)}
                </p>
              </div>
              {/* Actions */}
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={onEdit}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-red-500"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {meeting.description && (
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{meeting.description}</p>
            )}

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {meeting.location && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" /> {meeting.location}
                </span>
              )}
              {meeting.meeting_url && (
                <a
                  href={meeting.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <Video className="w-3 h-3" /> Join Meeting
                </a>
              )}
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {TARGET_LABELS[meeting.target_roles]}
              </span>
              {/* RSVP counts */}
              <button
                onClick={onViewRsvps}
                className="flex items-center gap-2 text-xs hover:text-foreground text-muted-foreground"
              >
                <Users className="w-3 h-3" />
                <span className="text-green-600 flex items-center gap-0.5"><Check className="w-3 h-3" />{counts.accepted}</span>
                <span className="text-red-500 flex items-center gap-0.5"><X className="w-3 h-3" />{counts.declined}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminMeetingsPage() {
  const [filter, setFilter]       = useState<Filter>('upcoming')
  const [formOpen, setFormOpen]   = useState(false)
  const [editItem, setEditItem]   = useState<Meeting | undefined>()
  const [deleteItem, setDeleteItem] = useState<Meeting | undefined>()
  const [rsvpMeeting, setRsvpMeeting] = useState<Meeting | undefined>()

  const { data: meetings = [], isLoading } = useMeetings()
  const deleteMutation = useDeleteMeeting()

  const filtered = meetings.filter(m => {
    if (filter === 'upcoming') return isUpcoming(m.meeting_date)
    if (filter === 'past') return !isUpcoming(m.meeting_date)
    return true
  })

  function openCreate() {
    setEditItem(undefined)
    setFormOpen(true)
  }

  function handleDelete() {
    if (!deleteItem) return
    deleteMutation.mutate(deleteItem.id, { onSuccess: () => setDeleteItem(undefined) })
  }

  return (
    <DashboardLayout title="Meetings" allowedRoles={['admin', 'hr', 'manager', 'director']}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted-foreground">Schedule and manage team meetings</p>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="w-4 h-4" /> New Meeting
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

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <Video className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No meetings found.</p>
          <Button variant="outline" className="mt-4" onClick={openCreate}>
            Schedule your first meeting
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(m => (
            <MeetingCard
              key={m.id}
              meeting={m}
              onEdit={() => { setEditItem(m); setFormOpen(true) }}
              onDelete={() => setDeleteItem(m)}
              onViewRsvps={() => setRsvpMeeting(m)}
            />
          ))}
        </div>
      )}

      <MeetingFormDialog
        open={formOpen}
        initial={editItem}
        onClose={() => { setFormOpen(false); setEditItem(undefined) }}
      />
      <DeleteDialog
        open={!!deleteItem}
        title={deleteItem?.title ?? ''}
        onConfirm={handleDelete}
        onClose={() => setDeleteItem(undefined)}
        isPending={deleteMutation.isPending}
      />
      {rsvpMeeting && (
        <RsvpListDialog
          meetingId={rsvpMeeting.id}
          title={rsvpMeeting.title}
          onClose={() => setRsvpMeeting(undefined)}
        />
      )}
    </DashboardLayout>
  )
}
