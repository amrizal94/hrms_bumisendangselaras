'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  Users, Clock, CalendarDays, Receipt,
  AlertTriangle, CheckCircle, ScanFace, BarChart3,
  TrendingUp, Wallet, Timer, CalendarRange,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { StatCard } from '@/components/layout/stat-card'
import { PendingLeavePanel } from '@/components/dashboard/pending-leave-panel'
import { PendingOvertimePanel } from '@/components/dashboard/pending-overtime-panel'
import { TodayAttendancePanel } from '@/components/dashboard/today-attendance-panel'
import { useOverview, useDailyTrend, useDepartmentToday } from '@/hooks/use-reports'

const QUICK_ACTIONS = [
  { label: 'Employees',   href: '/admin/employees', icon: Users,         color: 'text-blue-600',   bg: 'bg-blue-50' },
  { label: 'Attendance',  href: '/admin/attendance', icon: Clock,        color: 'text-green-600',  bg: 'bg-green-50' },
  { label: 'Leave',       href: '/admin/leave',      icon: CalendarDays, color: 'text-orange-600', bg: 'bg-orange-50' },
  { label: 'Overtime',    href: '/admin/overtime',   icon: Timer,        color: 'text-amber-600',  bg: 'bg-amber-50' },
  { label: 'Holidays',    href: '/admin/holidays',   icon: CalendarRange, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { label: 'Payroll',     href: '/admin/payroll',    icon: Receipt,      color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Face Enroll', href: '/admin/face',       icon: ScanFace,     color: 'text-rose-600',   bg: 'bg-rose-50' },
  { label: 'Reports',     href: '/admin/reports',    icon: BarChart3,    color: 'text-cyan-600',   bg: 'bg-cyan-50' },
]

// Pre-computed once at module load — avoids Math.random() during render
const SKELETON_BAR_HEIGHTS = Array.from({ length: 22 }, () => 30 + Math.random() * 50)

// ─── Daily Trend Chart ───────────────────────────────────────────────────────
function DailyTrendChart() {
  const now = new Date()
  const { data, isLoading } = useDailyTrend({ year: now.getFullYear(), month: now.getMonth() + 1 })

  const days = data?.data ?? []
  const maxTotal = data?.meta.total_employees ?? 1
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          Daily Attendance Trend
        </h3>
        <span className="text-xs text-muted-foreground">
          {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" /> Present</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400 inline-block" /> Late</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-300 inline-block" /> Absent</span>
      </div>

      {isLoading ? (
        <div className="h-32 flex items-end gap-1 animate-pulse">
          {SKELETON_BAR_HEIGHTS.map((h, i) => (
            <div key={i} className="flex-1 bg-muted rounded-t" style={{ height: `${h}%` }} />
          ))}
        </div>
      ) : days.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">
          No data yet for this month
        </div>
      ) : (
        <div className="flex items-end gap-[2px] h-32 overflow-x-auto">
          {days.map((d) => {
            const presentH = maxTotal > 0 ? ((d.present - d.late) / maxTotal) * 100 : 0
            const lateH    = maxTotal > 0 ? (d.late / maxTotal) * 100 : 0
            const absentH  = maxTotal > 0 ? (d.absent / maxTotal) * 100 : 0
            return (
              <div
                key={d.date}
                className="flex-1 min-w-[8px] flex flex-col-reverse rounded-t overflow-hidden cursor-default group relative"
                title={`${d.date}\nPresent: ${d.present}  Late: ${d.late}  Absent: ${d.absent}`}
              >
                {/* Absent (top = bottom of stack visually since flex-col-reverse) */}
                <div className="bg-red-300 w-full" style={{ height: `${absentH}%` }} />
                {/* Late */}
                <div className="bg-amber-400 w-full" style={{ height: `${lateH}%` }} />
                {/* Present (on-time) */}
                <div className="bg-emerald-500 w-full" style={{ height: `${presentH}%` }} />
              </div>
            )
          })}
        </div>
      )}

      {/* X-axis day labels — show every 5th */}
      {days.length > 0 && (
        <div className="flex gap-[2px] mt-1 overflow-x-auto">
          {days.map((d, i) => (
            <div key={d.date} className="flex-1 min-w-[8px] text-center text-[9px] text-muted-foreground">
              {i % 5 === 0 ? d.day : ''}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ─── Department Today ─────────────────────────────────────────────────────────
function DepartmentTodayCard() {
  const { data, isLoading } = useDepartmentToday()
  const rows = data?.data ?? []
  const meta = data?.meta

  const facePercent = useMemo(() => {
    if (!meta || meta.face_total === 0) return 0
    return Math.round((meta.face_enrolled / meta.face_total) * 100)
  }, [meta])

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-sm">Department Attendance</h3>
        <span className="text-xs text-muted-foreground">Today</span>
      </div>

      {/* Face enrollment sub-info */}
      {meta && (
        <p className="text-xs text-muted-foreground mb-4">
          Face enrolled: <span className="font-medium text-foreground">{meta.face_enrolled}/{meta.face_total}</span>
          <span className="ml-1 text-muted-foreground">({facePercent}%)</span>
        </p>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">No departments found.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((dept) => (
            <div key={dept.department_id}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium truncate max-w-[60%]">{dept.department_name}</span>
                <span className="text-muted-foreground">
                  <span className="text-emerald-600 font-semibold">{dept.present}</span>/{dept.total}
                  {dept.late > 0 && (
                    <span className="text-amber-500 ml-1">({dept.late} late)</span>
                  )}
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${dept.total > 0 ? ((dept.present - dept.late) / dept.total) * 100 : 0}%` }}
                />
                <div
                  className="h-full bg-amber-400 transition-all"
                  style={{ width: `${dept.total > 0 ? (dept.late / dept.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t">
        <Link href="/admin/reports" className="text-xs text-primary hover:underline">
          View full reports →
        </Link>
      </div>
    </Card>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const { data: overviewData, isLoading } = useOverview()
  const ov = overviewData?.data

  const sk = isLoading ? '—' : undefined

  const fmtCurrency = (v: number | undefined) =>
    v == null ? '—' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v)

  return (
    <DashboardLayout title="Admin Dashboard" allowedRoles={['admin', 'director']}>
      <div className="space-y-6">

        {/* ── 6 Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Total Employees"
            value={sk ?? ov?.total_employees ?? '—'}
            subtitle="Active staff"
            icon={Users}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />
          <StatCard
            title="Present Today"
            value={sk ?? ov?.today.present ?? '—'}
            subtitle={ov ? `${ov.today.late} late` : undefined}
            icon={CheckCircle}
            iconColor="text-green-600"
            iconBg="bg-green-50"
          />
          <StatCard
            title="Absent Today"
            value={sk ?? ov?.today.absent ?? '—'}
            subtitle="Not checked in"
            icon={AlertTriangle}
            iconColor="text-red-600"
            iconBg="bg-red-50"
          />
          <StatCard
            title="Pending Leaves"
            value={sk ?? ov?.pending_leaves ?? '—'}
            subtitle="Awaiting approval"
            icon={CalendarDays}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
          />
          <StatCard
            title="Month Payroll"
            value={sk ?? fmtCurrency(ov?.payroll.total_net)}
            subtitle={ov ? `${ov.payroll.total_records} records` : 'Net salary'}
            icon={Wallet}
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
          />
          <StatCard
            title="Month Attendance"
            value={sk ?? (ov ? `${ov.month_attendance.present + ov.month_attendance.late}` : '—')}
            subtitle={ov ? `${ov.month_attendance.absent} absent days` : 'Records'}
            icon={BarChart3}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
          />
        </div>

        {/* ── Daily Trend + Department Today ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DailyTrendChart />
          </div>
          <DepartmentTodayCard />
        </div>

        {/* ── Today check-ins + Quick actions ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TodayAttendancePanel limit={10} />
          </div>

          <Card className="p-5">
            <h3 className="font-semibold text-sm mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border hover:bg-muted/50 transition-colors text-center"
                >
                  <div className={`p-2 rounded-lg ${a.bg}`}>
                    <a.icon className={`w-4 h-4 ${a.color}`} />
                  </div>
                  <span className="text-xs font-medium text-foreground">{a.label}</span>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Pending requests ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PendingLeavePanel limit={6} />
          <PendingOvertimePanel limit={6} />
        </div>

      </div>
    </DashboardLayout>
  )
}
