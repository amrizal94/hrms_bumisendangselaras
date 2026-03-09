'use client'

import { useState } from 'react'
import { Megaphone } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { cn } from '@/lib/utils'
import { useAnnouncements } from '@/hooks/use-announcements'
import type { AnnouncementCategory } from '@/types/announcement'

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

// ── Filter ────────────────────────────────────────────────────────────────────

type FilterType = 'all' | AnnouncementCategory

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all',     label: 'All' },
  { key: 'general', label: 'General' },
  { key: 'hr',      label: 'HR' },
  { key: 'policy',  label: 'Policy' },
  { key: 'event',   label: 'Event' },
]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function StaffAnnouncementsPage() {
  const [filter, setFilter] = useState<FilterType>('all')

  const { data: announcements = [], isLoading } = useAnnouncements(
    filter !== 'all' ? { category: filter } : undefined
  )

  return (
    <DashboardLayout title="Announcements" allowedRoles={['staff', 'hr', 'admin']}>
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
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="font-semibold text-sm">{a.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.cls}`}>
                      {cat.label}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {TARGET_LABELS[a.target_roles]}
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-line">{a.content}</p>
                  <p className="text-xs text-muted-foreground mt-3">
                    {a.created_by && <span>{a.created_by} · </span>}
                    {fmtDate(a.created_at)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
