'use client'

import Link from 'next/link'
import {
  Users, Clock, CalendarDays, CheckCircle, AlertTriangle,
  UserCheck, Receipt, Timer, BarChart3, FileText,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { StatCard } from '@/components/layout/stat-card'
import { PendingLeavePanel } from '@/components/dashboard/pending-leave-panel'
import { PendingOvertimePanel } from '@/components/dashboard/pending-overtime-panel'
import { TodayAttendancePanel } from '@/components/dashboard/today-attendance-panel'
import { useOverview } from '@/hooks/use-reports'
import { useAttendanceSummary } from '@/hooks/use-attendance'
import { useOvertimeSummary } from '@/hooks/use-overtime'

const QUICK_ACTIONS = [
  { label: 'Employees',  href: '/admin/employees',  icon: Users,       color: 'text-blue-600',      bg: 'bg-blue-50' },
  { label: 'Attendance', href: '/admin/attendance', icon: Clock,       color: 'text-green-600',     bg: 'bg-green-50' },
  { label: 'Leave',      href: '/admin/leave',      icon: CalendarDays,color: 'text-orange-600',    bg: 'bg-orange-50' },
  { label: 'Overtime',   href: '/admin/overtime',   icon: Timer,       color: 'text-indigo-600',    bg: 'bg-indigo-50' },
  { label: 'Payroll',    href: '/admin/payroll',    icon: Receipt,     color: 'text-purple-600',    bg: 'bg-purple-50' },
  { label: 'Expenses',   href: '/admin/expenses',   icon: FileText,    color: 'text-rose-600',      bg: 'bg-rose-50' },
  { label: 'Reports',    href: '/admin/reports',    icon: BarChart3,   color: 'text-teal-600',      bg: 'bg-teal-50' },
]

function AttendanceSummaryCard() {
  const { data: summary, isLoading } = useAttendanceSummary()

  const bars = [
    { label: 'Present',  value: summary?.present  ?? 0, color: 'bg-emerald-500', textColor: 'text-emerald-700' },
    { label: 'Late',     value: summary?.late      ?? 0, color: 'bg-amber-500',   textColor: 'text-amber-700' },
    { label: 'On Leave', value: summary?.on_leave  ?? 0, color: 'bg-purple-500',  textColor: 'text-purple-700' },
    { label: 'Absent',   value: summary?.absent    ?? 0, color: 'bg-red-400',     textColor: 'text-red-700' },
  ]

  const total = summary?.total_employees ?? 1

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Today&apos;s Attendance</h3>
        <span className="text-xs text-muted-foreground">
          {isLoading ? '…' : `${summary?.total_employees ?? 0} employees`}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-4 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {bars.map((b) => {
            const pct = total > 0 ? Math.round((b.value / total) * 100) : 0
            return (
              <div key={b.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{b.label}</span>
                  <span className={`font-semibold ${b.textColor}`}>
                    {b.value} <span className="text-muted-foreground font-normal">({pct}%)</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${b.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-4 pt-3 border-t">
        <Link href="/admin/attendance" className="text-xs text-primary hover:underline">
          Manage attendance →
        </Link>
      </div>
    </Card>
  )
}

export default function HRDashboardPage() {
  const { data: overviewData, isLoading } = useOverview()
  const { data: overtimeSummary }         = useOvertimeSummary()
  const ov = overviewData?.data

  const skeleton = isLoading ? '—' : undefined

  return (
    <DashboardLayout title="HR Dashboard" allowedRoles={['hr', 'admin', 'director']}>
      <div className="space-y-6">

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Employees"
            value={skeleton ?? ov?.total_employees ?? '—'}
            subtitle="Active staff"
            icon={Users}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />
          <StatCard
            title="Present Today"
            value={skeleton ?? ov?.today.present ?? '—'}
            subtitle={ov ? `${ov.today.late} arrived late` : undefined}
            icon={CheckCircle}
            iconColor="text-green-600"
            iconBg="bg-green-50"
          />
          <StatCard
            title="Pending Leave"
            value={skeleton ?? ov?.pending_leaves ?? '—'}
            subtitle="Awaiting approval"
            icon={UserCheck}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
          />
          <StatCard
            title="Pending Overtime"
            value={overtimeSummary?.pending ?? '—'}
            subtitle="Awaiting approval"
            icon={Timer}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />
        </div>

        {/* Middle grid: pending panels + attendance summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <PendingLeavePanel limit={5} />
            <PendingOvertimePanel limit={5} />
          </div>
          <div className="space-y-5">
            <AttendanceSummaryCard />
            {/* Absent today count */}
            <Card className="p-5">
              <h3 className="font-semibold text-sm mb-3">Absent Today</h3>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-red-50">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{ov?.today.absent ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">employees not checked in</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Today's check-ins feed */}
        <TodayAttendancePanel limit={8} />

        {/* Quick actions */}
        <Card className="p-5">
          <h3 className="font-semibold text-sm mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {QUICK_ACTIONS.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/50 transition-colors"
              >
                <div className={`p-2 rounded-lg ${a.bg} shrink-0`}>
                  <a.icon className={`w-4 h-4 ${a.color}`} />
                </div>
                <span className="text-sm font-medium text-foreground">{a.label}</span>
              </Link>
            ))}
          </div>
        </Card>

      </div>
    </DashboardLayout>
  )
}
