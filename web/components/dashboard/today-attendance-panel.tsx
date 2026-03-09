'use client'

import { Clock } from 'lucide-react'
import Link from 'next/link'
import { useAttendance } from '@/hooks/use-attendance'

const TODAY = new Date().toISOString().slice(0, 10)

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  present:  { label: 'Present',  cls: 'bg-emerald-100 text-emerald-700' },
  late:     { label: 'Late',     cls: 'bg-amber-100 text-amber-700' },
  absent:   { label: 'Absent',   cls: 'bg-red-100 text-red-700' },
  on_leave: { label: 'On Leave', cls: 'bg-purple-100 text-purple-700' },
  half_day: { label: 'Half Day', cls: 'bg-blue-100 text-blue-700' },
}

function fmtTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

export function TodayAttendancePanel({ limit = 8 }: { limit?: number }) {
  const { data, isLoading } = useAttendance({ date: TODAY, per_page: limit })
  const records = data?.data ?? []

  return (
    <div className="rounded-xl border bg-card h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Today&apos;s Check-Ins</h3>
        </div>
        <Link href="/admin/attendance" className="text-xs text-primary hover:underline">
          View all
        </Link>
      </div>

      <div className="divide-y">
        {isLoading && (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
        )}
        {!isLoading && records.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No check-ins yet today.
          </div>
        )}
        {records.map((rec) => {
          const s = STATUS_STYLES[rec.status] ?? { label: rec.status, cls: 'bg-gray-100 text-gray-600' }
          return (
            <div key={rec.id} className="flex items-center justify-between px-5 py-2.5 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                  {rec.employee?.user.name.charAt(0) ?? '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{rec.employee?.user.name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {rec.employee?.department?.name ?? rec.employee?.position ?? ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground tabular-nums">{fmtTime(rec.check_in)}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
