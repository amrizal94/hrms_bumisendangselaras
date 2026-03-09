'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, CalendarDays, Timer, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/use-notifications'
import type { AppNotification } from '@/types/notification'
import { cn } from '@/lib/utils'

function fmtTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1)  return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24)   return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  return `${diffD}d ago`
}

const TYPE_ICON: Record<string, React.ElementType> = {
  leave_status:   CalendarDays,
  overtime_status: Timer,
  general:        Info,
}

const TYPE_COLOR: Record<string, string> = {
  leave_status:   'bg-orange-100 text-orange-600',
  overtime_status: 'bg-blue-100 text-blue-600',
  general:        'bg-slate-100 text-slate-600',
}

interface NotificationItemProps {
  notification: AppNotification
  onRead: (id: string) => void
  onNavigate: (link?: string | null) => void
}

function NotificationItem({ notification, onRead, onNavigate }: NotificationItemProps) {
  const Icon = TYPE_ICON[notification.type] ?? Info
  const color = TYPE_COLOR[notification.type] ?? TYPE_COLOR.general

  function handleClick() {
    if (!notification.read) onRead(notification.id)
    if (notification.link) onNavigate(notification.link)
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b last:border-0',
        !notification.read && 'bg-primary/5'
      )}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn('text-sm font-medium', !notification.read && 'text-foreground', notification.read && 'text-muted-foreground')}>
            {notification.title}
          </p>
          {!notification.read && (
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
        <p className="text-xs text-muted-foreground/60 mt-1">{fmtTime(notification.created_at)}</p>
      </div>
    </button>
  )
}

export function NotificationBell() {
  const router = useRouter()
  const { data } = useNotifications()
  const markRead    = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const notifications = data?.data ?? []
  const unreadCount   = data?.unread_count ?? 0

  function handleNavigate(link?: string | null) {
    if (link) router.push(link)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-slate-500">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-semibold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-primary"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-10 text-center">
              <Bell className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            notifications.map(n => (
              <NotificationItem
                key={n.id}
                notification={n}
                onRead={(id) => markRead.mutate(id)}
                onNavigate={handleNavigate}
              />
            ))
          )}
        </div>

        {/* Footer — View all */}
        <div className="border-t px-4 py-2.5 text-center">
          <Link
            href="/notifications"
            className="text-xs text-primary hover:underline font-medium"
          >
            View all notifications
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
