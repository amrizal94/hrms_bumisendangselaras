'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CalendarDays, CheckCheck, Info, Megaphone, Timer } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks/use-notifications'
import type { AppNotification } from '@/types/notification'

// ── Helpers ──────────────────────────────────────────────────────────────────
const TYPE_ICON: Record<string, React.ElementType> = {
  leave_status:    CalendarDays,
  overtime_status: Timer,
  announcement:    Megaphone,
  general:         Info,
}

const TYPE_COLOR: Record<string, string> = {
  leave_status:    'bg-orange-100 text-orange-600',
  overtime_status: 'bg-blue-100 text-blue-600',
  announcement:    'bg-violet-100 text-violet-600',
  general:         'bg-slate-100 text-slate-600',
}

const TYPE_LABEL: Record<string, string> = {
  leave_status:    'Leave',
  overtime_status: 'Overtime',
  announcement:    'Announcement',
  general:         'General',
}

function fmtTime(iso: string) {
  const d      = new Date(iso)
  const diffMs = Date.now() - d.getTime()
  const mins   = Math.floor(diffMs / 60_000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30)  return `${days}d ago`
  return d.toLocaleDateString()
}

// ── Filter types ─────────────────────────────────────────────────────────────
type FilterType = 'all' | 'leave_status' | 'overtime_status' | 'announcement' | 'general'

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all',            label: 'All' },
  { key: 'leave_status',   label: 'Leave' },
  { key: 'overtime_status', label: 'Overtime' },
  { key: 'announcement',   label: 'Announcements' },
  { key: 'general',        label: 'General' },
]

// ── Page ─────────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const [filter, setFilter] = useState<FilterType>('all')
  const { data, isLoading }  = useNotifications()
  const markRead             = useMarkNotificationRead()
  const markAllRead          = useMarkAllNotificationsRead()
  const router               = useRouter()

  const all         = data?.data ?? []
  const unreadCount = data?.unread_count ?? 0
  const filtered    = filter === 'all' ? all : all.filter((n) => n.type === filter)

  function handleClick(n: AppNotification) {
    if (!n.read) markRead.mutate(n.id)
    if (n.link)  router.push(n.link)
  }

  return (
    <DashboardLayout title="Notifications">
      <div className="max-w-2xl">

        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {all.length} notification{all.length !== 1 ? 's' : ''}
            </span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">{unreadCount} unread</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="gap-1.5"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {FILTERS.map((f) => (
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
              {f.key === 'all' && all.length > 0 && (
                <span className="ml-1.5 text-xs opacity-70">{all.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="rounded-lg border bg-card divide-y">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            filtered.map((n) => {
              const Icon  = TYPE_ICON[n.type]  ?? Info
              const color = TYPE_COLOR[n.type] ?? TYPE_COLOR.general
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    'w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-muted/40 transition-colors',
                    !n.read && 'bg-primary/5'
                  )}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm font-medium', n.read && 'text-muted-foreground')}>
                        {n.title}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground/60 whitespace-nowrap">
                          {fmtTime(n.created_at)}
                        </span>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                    <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full ${color}`}>
                      {TYPE_LABEL[n.type] ?? 'General'}
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
