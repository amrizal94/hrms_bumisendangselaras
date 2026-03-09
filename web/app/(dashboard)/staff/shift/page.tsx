'use client'

import { AlarmClock } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useMyShift } from '@/hooks/use-shifts'

const DAY_LABELS: Record<number, string> = {
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
  7: 'Minggu',
}

const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7]

export default function StaffShiftPage() {
  const { data: shift, isLoading } = useMyShift()

  return (
    <DashboardLayout title="My Shift" allowedRoles={['staff', 'hr', 'admin']}>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Shift</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Your assigned work shift and schedule</p>
        </div>

        {isLoading ? (
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="h-7 w-48 bg-muted animate-pulse rounded" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-muted animate-pulse rounded-lg" />
              <div className="h-20 bg-muted animate-pulse rounded-lg" />
            </div>
            <div className="h-14 bg-muted animate-pulse rounded-lg" />
            <div className="flex gap-2">
              {ALL_DAYS.map(d => <div key={d} className="h-8 w-16 bg-muted animate-pulse rounded-full" />)}
            </div>
          </div>
        ) : shift === null || shift === undefined ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlarmClock className="w-16 h-16 text-muted-foreground/40 mb-4" />
            <h3 className="font-semibold text-lg text-muted-foreground">Belum ada shift yang diassign.</h3>
            <p className="text-sm text-muted-foreground mt-1">Hubungi HR untuk informasi lebih lanjut.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{shift.name}</h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  shift.is_active
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-100 text-gray-500 border-gray-200'
                }`}
              >
                {shift.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Time grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4">
                <p className="text-xs font-medium text-emerald-600 mb-1">Check-In Time</p>
                <p className="text-2xl font-bold text-emerald-700 tabular-nums">{shift.check_in_time}</p>
              </div>
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
                <p className="text-xs font-medium text-blue-600 mb-1">Check-Out Time</p>
                <p className="text-2xl font-bold text-blue-700 tabular-nums">{shift.check_out_time}</p>
              </div>
            </div>

            {/* Late tolerance */}
            <div className="rounded-lg bg-orange-50 border border-orange-100 p-4">
              <p className="text-xs font-medium text-orange-600 mb-1">Late Tolerance</p>
              <p className="text-lg font-semibold text-orange-700">
                {shift.late_tolerance_minutes} minutes
              </p>
              <p className="text-xs text-orange-500 mt-0.5">
                Check-in after {shift.check_in_time} +{shift.late_tolerance_minutes}min is marked as late.
              </p>
            </div>

            {/* Work days */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Work Days</p>
              <div className="flex flex-wrap gap-2">
                {ALL_DAYS.map(day => {
                  const active = shift.work_days.includes(day)
                  return (
                    <span
                      key={day}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                        active
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {DAY_LABELS[day]}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
