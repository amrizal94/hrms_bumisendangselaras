'use client'

import Link from 'next/link'
import {
  Users, Clock, CalendarDays, CheckCircle, AlertTriangle,
  UserCheck, Timer, BarChart3, FolderKanban, Megaphone,
  ScanFace, Receipt, QrCode, Video,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { StatCard } from '@/components/layout/stat-card'
import { PendingLeavePanel } from '@/components/dashboard/pending-leave-panel'
import { PendingOvertimePanel } from '@/components/dashboard/pending-overtime-panel'
import { TodayAttendancePanel } from '@/components/dashboard/today-attendance-panel'
import { useOverview } from '@/hooks/use-reports'
import { useOvertimeSummary } from '@/hooks/use-overtime'

const QUICK_ACTIONS = [
  { label: 'Employees',         href: '/admin/employees',     icon: Users,        color: 'text-blue-600',   bg: 'bg-blue-50' },
  { label: 'Attendance',        href: '/admin/attendance',    icon: Clock,        color: 'text-green-600',  bg: 'bg-green-50' },
  { label: 'Leave',             href: '/admin/leave',         icon: CalendarDays, color: 'text-orange-600', bg: 'bg-orange-50' },
  { label: 'Overtime',          href: '/admin/overtime',      icon: Timer,        color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { label: 'Reports',           href: '/admin/reports',       icon: BarChart3,    color: 'text-teal-600',   bg: 'bg-teal-50' },
  { label: 'Projects & Tasks',  href: '/admin/projects',      icon: FolderKanban, color: 'text-violet-600', bg: 'bg-violet-50' },
  { label: 'Announcements',     href: '/admin/announcements', icon: Megaphone,    color: 'text-pink-600',   bg: 'bg-pink-50' },
  { label: 'Meetings',          href: '/admin/meetings',      icon: Video,        color: 'text-sky-600',    bg: 'bg-sky-50' },
  { label: 'Expense Approvals', href: '/admin/expenses',      icon: Receipt,      color: 'text-amber-600',  bg: 'bg-amber-50' },
  { label: 'Face Data',         href: '/admin/face',          icon: ScanFace,     color: 'text-cyan-600',   bg: 'bg-cyan-50' },
]

export default function ManagerDashboardPage() {
  const { data: overviewData, isLoading } = useOverview()
  const { data: overtimeSummary }         = useOvertimeSummary()
  const ov = overviewData?.data

  const skeleton = isLoading ? '—' : undefined

  return (
    <DashboardLayout title="Manager Dashboard" allowedRoles={['manager', 'admin']}>
      <div className="space-y-6">

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Employees"
            value={skeleton ?? ov?.total_employees ?? '—'}
            subtitle="Active staff"
            icon={Users}
            iconColor="text-teal-600"
            iconBg="bg-teal-50"
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

        {/* Middle grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <PendingLeavePanel limit={5} />
            <PendingOvertimePanel limit={5} />
          </div>
          <div className="space-y-5">
            {/* Absent today */}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
