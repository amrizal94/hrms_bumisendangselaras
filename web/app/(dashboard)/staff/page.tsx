'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Clock, CalendarDays, Receipt, ScanFace, Timer,
  LogIn, LogOut, ChevronRight, CheckCircle2, AlarmClock, Megaphone, ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { StatCard } from '@/components/layout/stat-card'
import { FaceCheckinDialog } from './attendance/face-checkin-dialog'
import { useAuthStore } from '@/store/auth-store'
import { useTodayAttendance, useCheckIn, useCheckOut, useMyAttendance } from '@/hooks/use-attendance'
import { useLeaveQuota, useMyLeaves } from '@/hooks/use-leave'
import { useMyOvertimes } from '@/hooks/use-overtime'
import { useMyPayslips } from '@/hooks/use-payroll'
import { useMyShift } from '@/hooks/use-shifts'
import { useAnnouncements } from '@/hooks/use-announcements'

// ─── helpers ─────────────────────────────────────────────────────────────────

// Date helpers — computed as functions so they stay fresh if tab is open overnight
function getToday()      { return new Date().toISOString().slice(0, 10) }
function getMonthStart() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

const IDR = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v)

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  present:  { label: 'Present',  cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  late:     { label: 'Late',     cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  absent:   { label: 'Absent',   cls: 'bg-red-100 text-red-700 border-red-200' },
  on_leave: { label: 'On Leave', cls: 'bg-purple-100 text-purple-700 border-purple-200' },
  half_day: { label: 'Half Day', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
}

function fmtTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })
}

// ─── Live Clock ───────────────────────────────────────────────────────────────

function LiveClock({ name }: { name: string }) {
  const [time, setTime] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const timeStr = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="bg-gradient-to-br from-primary to-blue-700 rounded-2xl p-6 text-white">
      <p className="text-blue-200 text-sm">Welcome back,</p>
      <h2 className="text-2xl font-bold mt-0.5">{name}</h2>
      <p className="text-blue-200 text-sm mt-1">{dateStr}</p>
      <p className="text-5xl font-light tabular-nums mt-4 tracking-tight">{timeStr}</p>
    </div>
  )
}

// ─── Today Status Card ────────────────────────────────────────────────────────

function TodayCard() {
  const { data: today, isLoading } = useTodayAttendance()
  const checkInMutation  = useCheckIn()
  const checkOutMutation = useCheckOut()
  const [faceDialog, setFaceDialog] = useState<{ open: boolean; action: 'check_in' | 'check_out' }>({
    open: false, action: 'check_in',
  })

  const canCheckIn  = !isLoading && !today
  const canCheckOut = !isLoading && !!today && !today.check_out

  const statusStyle = today ? (STATUS_BADGE[today.status] ?? STATUS_BADGE.present) : null

  return (
    <>
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Today&apos;s Attendance</h3>
            {statusStyle && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyle.cls}`}>
                {statusStyle.label}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="h-12 bg-muted animate-pulse rounded-lg" />
          ) : today ? (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Check In</p>
                <p className="text-xl font-bold tabular-nums">{fmtTime(today.check_in)}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Check Out</p>
                <p className="text-xl font-bold tabular-nums">{fmtTime(today.check_out)}</p>
              </div>
              {today.work_hours && (
                <div className="col-span-2 text-center text-sm text-muted-foreground">
                  Work hours: <span className="font-semibold text-foreground">{today.work_hours}h</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-4">You have not checked in yet today.</p>
          )}

          {/* Manual buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm" className="flex-1 gap-1.5"
              disabled={!canCheckIn || checkInMutation.isPending}
              onClick={() => checkInMutation.mutate()}
            >
              <LogIn className="w-3.5 h-3.5" /> Check In
            </Button>
            <Button
              size="sm" variant="outline" className="flex-1 gap-1.5"
              disabled={!canCheckOut || checkOutMutation.isPending}
              onClick={() => checkOutMutation.mutate()}
            >
              <LogOut className="w-3.5 h-3.5" /> Check Out
            </Button>
          </div>

          {/* Face buttons */}
          <div className="flex flex-wrap gap-2 mt-2">
            <Button
              size="sm" variant="secondary" className="flex-1 gap-1.5 text-xs"
              disabled={!canCheckIn}
              onClick={() => setFaceDialog({ open: true, action: 'check_in' })}
            >
              <ScanFace className="w-3.5 h-3.5" /> Face Check-In
            </Button>
            <Button
              size="sm" variant="secondary" className="flex-1 gap-1.5 text-xs"
              disabled={!canCheckOut}
              onClick={() => setFaceDialog({ open: true, action: 'check_out' })}
            >
              <ScanFace className="w-3.5 h-3.5" /> Face Check-Out
            </Button>
          </div>
        </CardContent>
      </Card>

      <FaceCheckinDialog
        open={faceDialog.open}
        action={faceDialog.action}
        onOpenChange={open => setFaceDialog(d => ({ ...d, open }))}
      />
    </>
  )
}

// ─── Leave Quota Panel ────────────────────────────────────────────────────────

function LeaveQuotaPanel() {
  const { data: quotas, isLoading } = useLeaveQuota()

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h3 className="font-semibold text-sm">Leave Balance</h3>
        {[1, 2, 3].map(i => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}
      </div>
    )
  }

  const shown = quotas?.slice(0, 4) ?? []

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Leave Balance</h3>
        <Link href="/staff/leave" className="text-xs text-primary hover:underline flex items-center gap-0.5">
          Apply <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      {shown.length === 0 ? (
        <p className="text-xs text-muted-foreground">No leave types configured.</p>
      ) : (
        <div className="space-y-3.5">
          {shown.map(q => {
            const pct = q.max_days > 0 ? Math.round((q.used_days / q.max_days) * 100) : 0
            return (
              <div key={q.leave_type.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium truncate">{q.leave_type.name}</span>
                  <span className="text-muted-foreground shrink-0 ml-2">
                    {q.remaining}d left / {q.max_days}d
                  </span>
                </div>
                <Progress value={pct} className="h-1.5" />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── My Pending Leaves ────────────────────────────────────────────────────────

function MyPendingLeaves() {
  const { data } = useMyLeaves({ status: 'pending', per_page: 5 })
  const pending = data?.data ?? []

  if (pending.length === 0) return null

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          Pending Requests
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">{pending.length}</Badge>
        </h3>
        <Link href="/staff/leave" className="text-xs text-primary hover:underline">View all</Link>
      </div>
      <div className="space-y-2">
        {pending.map(req => (
          <div key={req.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
            <div>
              <p className="font-medium">{req.leave_type?.name ?? '—'}</p>
              <p className="text-xs text-muted-foreground">
                {fmtDate(req.start_date)} · {req.total_days}d
              </p>
            </div>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── My Pending Overtimes ─────────────────────────────────────────────────────

function MyPendingOvertimes() {
  const { data } = useMyOvertimes({ status: 'pending', per_page: 5 })
  const pending = data?.data ?? []

  if (pending.length === 0) return null

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          Pending Overtime
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">{pending.length}</Badge>
        </h3>
        <Link href="/staff/overtime" className="text-xs text-primary hover:underline">View all</Link>
      </div>
      <div className="space-y-2">
        {pending.map(req => (
          <div key={req.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
            <div>
              <p className="font-medium">
                {new Date(req.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-xs text-muted-foreground">
                {req.overtime_hours}h · {req.overtime_type.charAt(0).toUpperCase() + req.overtime_type.slice(1)}
              </p>
            </div>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Recent Attendance ────────────────────────────────────────────────────────

function RecentAttendance() {
  const { data, isLoading } = useMyAttendance({ per_page: 7 })
  const records = data?.data ?? []

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <h3 className="font-semibold text-sm">Recent Attendance</h3>
        <Link href="/staff/attendance" className="text-xs text-primary hover:underline">View all</Link>
      </div>
      <div className="divide-y">
        {isLoading && (
          <div className="py-6 text-center text-sm text-muted-foreground">Loading...</div>
        )}
        {!isLoading && records.length === 0 && (
          <div className="py-6 text-center text-sm text-muted-foreground">No attendance records yet.</div>
        )}
        {records.map(rec => {
          const s = STATUS_BADGE[rec.status] ?? STATUS_BADGE.present
          return (
            <div key={rec.id} className="flex items-center justify-between px-5 py-3 gap-3">
              <div>
                <p className="text-sm font-medium">{fmtDate(rec.date)}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {fmtTime(rec.check_in)} → {fmtTime(rec.check_out)}
                  {rec.work_hours ? ` · ${rec.work_hours}h` : ''}
                </p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.cls}`}>
                {s.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Latest Announcements Panel ──────────────────────────────────────────────

function LatestAnnouncements() {
  const { data: list = [] } = useAnnouncements({ limit: 3 })
  if (list.length === 0) return null
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm flex items-center gap-1.5">
          <Megaphone className="w-3.5 h-3.5" />
          Announcements
        </h3>
        <Link href="/staff/announcements" className="text-xs text-primary hover:underline">
          View all
        </Link>
      </div>
      <div className="space-y-2">
        {list.map(a => (
          <div key={a.id} className="py-2 border-b last:border-0">
            <p className="text-sm font-medium truncate">{a.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{a.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StaffDashboardPage() {
  const user = useAuthStore(s => s.user)

  // Computed fresh on each render — stays correct if tab is open overnight
  const today      = getToday()
  const monthStart = getMonthStart()
  const year       = new Date().getFullYear()
  const monthName  = new Date().toLocaleString('id-ID', { month: 'long' })

  // Month attendance count
  const { data: monthData } = useMyAttendance({ date_from: monthStart, date_to: today, per_page: 31 })
  const presentDays = monthData?.data.filter(r => ['present', 'late'].includes(r.status)).length ?? 0

  // Leave quota — annual balance
  const { data: quotas } = useLeaveQuota()
  const annualQuota  = quotas?.find(q => q.leave_type.code === 'ANNUAL' || q.leave_type.name.toLowerCase().includes('annual'))
  const annualRemain = annualQuota?.remaining ?? '—'

  // Latest payslip
  const { data: payslipData } = useMyPayslips({ per_page: 1 })
  const lastPayslip = payslipData?.data?.[0]

  // My shift
  const { data: shift } = useMyShift()

  return (
    <DashboardLayout title="My Dashboard" allowedRoles={['staff', 'hr', 'admin']}>
      <div className="space-y-5">

        {/* Welcome + Clock */}
        <LiveClock name={user?.name ?? 'Employee'} />

        {/* Top grid: Today card + Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="md:col-span-2 lg:col-span-1">
            <TodayCard />
          </div>
          <StatCard
            title="Days Present"
            value={presentDays}
            subtitle={`${monthName} ${year}`}
            icon={CheckCircle2}
            iconColor="text-green-600"
            iconBg="bg-green-50"
          />
          <StatCard
            title="Annual Leave Left"
            value={typeof annualRemain === 'number' ? `${annualRemain}d` : annualRemain}
            subtitle={annualQuota ? `Used ${annualQuota.used_days} / ${annualQuota.max_days} days` : 'Not configured'}
            icon={CalendarDays}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />
          <StatCard
            title="Last Net Salary"
            value={lastPayslip ? IDR(lastPayslip.net_salary) : '—'}
            subtitle={lastPayslip ? lastPayslip.period_label : 'No payslip yet'}
            icon={Receipt}
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
          />
          <StatCard
            title="My Shift"
            value={shift?.name ?? '—'}
            subtitle={shift ? `${shift.check_in_time} – ${shift.check_out_time}` : 'No shift assigned'}
            icon={AlarmClock}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
          />
        </div>

        {/* Bottom grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Recent attendance — takes 2/3 */}
          <div className="lg:col-span-2 space-y-5">
            <RecentAttendance />
            <MyPendingLeaves />
            <MyPendingOvertimes />
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            <LeaveQuotaPanel />
            <LatestAnnouncements />

            {/* Quick nav */}
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold text-sm mb-3">Quick Links</h3>
              <div className="space-y-1">
                {[
                  { href: '/staff/attendance', icon: Clock,        label: 'Attendance History', color: 'text-green-600' },
                  { href: '/staff/leave',      icon: CalendarDays, label: 'My Leave',           color: 'text-orange-600' },
                  { href: '/staff/overtime',   icon: Timer,        label: 'My Overtime',        color: 'text-blue-600' },
                  { href: '/staff/payslip',    icon: Receipt,      label: 'My Payslips',        color: 'text-purple-600' },
                  { href: '/staff/shift',       icon: AlarmClock,    label: 'My Shift',           color: 'text-indigo-600' },
                  { href: '/staff/face-enroll', icon: ShieldCheck,   label: 'Daftarkan Wajah',    color: 'text-teal-600' },
                ].map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                    <span className="text-sm">{item.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Last payslip details */}
            {lastPayslip && (
              <div className="rounded-xl border bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Latest Payslip</h3>
                  <Badge
                    variant="outline"
                    className={
                      lastPayslip.status === 'paid'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : lastPayslip.status === 'finalized'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-gray-50 text-gray-600'
                    }
                  >
                    {lastPayslip.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{lastPayslip.period_label}</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gross</span>
                    <span>{IDR(lastPayslip.gross_salary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deductions</span>
                    <span className="text-red-500">− {IDR(lastPayslip.total_deductions)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1.5 mt-1.5">
                    <span>Net</span>
                    <span className="text-emerald-600">{IDR(lastPayslip.net_salary)}</span>
                  </div>
                </div>
                <Link href="/staff/payslip" className="block mt-3 text-xs text-primary hover:underline">
                  View all payslips →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
