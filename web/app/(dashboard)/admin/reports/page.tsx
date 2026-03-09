'use client'

import { useState } from 'react'
import {
  Users, Clock, CalendarDays, Receipt, Timer,
  TrendingUp, AlertCircle, Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useOverview, useAttendanceReport, useLeaveReport, useOvertimeReport, usePayrollReport } from '@/hooks/use-reports'
import { useDepartments } from '@/hooks/use-employees'
import type { AttendanceReportRow, LeaveReportRow, OvertimeReportRow, PayrollReportRow } from '@/types/report'

// ─── helpers ────────────────────────────────────────────────────────────────

const NOW = new Date()
const CURRENT_YEAR  = NOW.getFullYear()
const CURRENT_MONTH = NOW.getMonth() + 1

const YEARS  = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i)
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const IDR = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v)

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-center gap-4">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  )
}

// ─── CSV export ─────────────────────────────────────────────────────────────

function exportCsv(headers: string[], rows: (string | number)[][], filename: string) {
  const lines = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([lines], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ─── Attendance Tab ──────────────────────────────────────────────────────────

function AttendanceTab({ year, month, deptId }: { year: number; month: number; deptId?: number }) {
  const { data, isLoading } = useAttendanceReport({ year, month, department_id: deptId })
  const rows = data?.data ?? []

  function handleExport() {
    exportCsv(
      ['Employee No', 'Name', 'Department', 'Working Days', 'Present', 'Late', 'On Leave', 'Absent', 'Total Hours', 'Rate %'],
      rows.map(r => [
        r.employee_number, r.name, r.department ?? '', r.working_days,
        r.present_days, r.late_days, r.leave_days, r.absent_days, r.total_hours, r.attendance_rate,
      ]),
      `attendance_${year}_${String(month).padStart(2, '0')}.csv`
    )
  }

  const avgRate = rows.length ? Math.round(rows.reduce((s, r) => s + r.attendance_rate, 0) / rows.length) : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {rows.length} employees · avg attendance <span className="font-semibold text-foreground">{avgRate}%</span>
        </p>
        <Button size="sm" variant="outline" onClick={handleExport} disabled={rows.length === 0}>
          <Download className="w-4 h-4 mr-1" /> Export CSV
        </Button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="text-center">Work Days</TableHead>
              <TableHead className="text-center">Present</TableHead>
              <TableHead className="text-center">Late</TableHead>
              <TableHead className="text-center">On Leave</TableHead>
              <TableHead className="text-center">Absent</TableHead>
              <TableHead className="text-center">Hours</TableHead>
              <TableHead>Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            )}
            {!isLoading && rows.length === 0 && (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No data for this period.</TableCell></TableRow>
            )}
            {rows.map((row: AttendanceReportRow) => (
              <TableRow key={row.employee_id}>
                <TableCell>
                  <p className="font-medium text-sm">{row.name}</p>
                  <p className="text-xs text-muted-foreground">{row.employee_number}</p>
                </TableCell>
                <TableCell className="text-sm">{row.department ?? '—'}</TableCell>
                <TableCell className="text-center text-sm">{row.working_days}</TableCell>
                <TableCell className="text-center">
                  <span className="text-sm font-medium text-emerald-600">{row.present_days}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm font-medium text-amber-600">{row.late_days}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm font-medium text-purple-600">{row.leave_days}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm font-medium text-red-500">{row.absent_days}</span>
                </TableCell>
                <TableCell className="text-center text-sm">{row.total_hours}h</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 min-w-[90px]">
                    <Progress value={row.attendance_rate} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground w-9 text-right">{row.attendance_rate}%</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// ─── Leave Tab ───────────────────────────────────────────────────────────────

function LeaveTab({ year, deptId }: { year: number; deptId?: number }) {
  const { data, isLoading } = useLeaveReport({ year, department_id: deptId })
  const rows = data?.data ?? []

  function handleExport() {
    exportCsv(
      ['Employee No', 'Name', 'Department', 'Approved Days', 'Pending Days', 'Rejected', 'Total Requests'],
      rows.map(r => [r.employee_number, r.name, r.department ?? '', r.approved_days, r.pending_days, r.rejected_count, r.total_requests]),
      `leave_report_${year}.csv`
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{rows.length} employees</p>
        <Button size="sm" variant="outline" onClick={handleExport} disabled={rows.length === 0}>
          <Download className="w-4 h-4 mr-1" /> Export CSV
        </Button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="text-center">Approved Days</TableHead>
              <TableHead className="text-center">Pending Days</TableHead>
              <TableHead className="text-center">Rejected</TableHead>
              <TableHead className="text-center">Total Requests</TableHead>
              <TableHead>Leave Breakdown</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            )}
            {!isLoading && rows.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No data for this year.</TableCell></TableRow>
            )}
            {rows.map((row: LeaveReportRow) => (
              <TableRow key={row.employee_id}>
                <TableCell>
                  <p className="font-medium text-sm">{row.name}</p>
                  <p className="text-xs text-muted-foreground">{row.employee_number}</p>
                </TableCell>
                <TableCell className="text-sm">{row.department ?? '—'}</TableCell>
                <TableCell className="text-center">
                  <span className="text-sm font-semibold text-emerald-600">{row.approved_days}d</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm font-semibold text-amber-600">{row.pending_days}d</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm font-semibold text-red-500">{row.rejected_count}</span>
                </TableCell>
                <TableCell className="text-center text-sm">{row.total_requests}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {row.by_type.length === 0
                      ? <span className="text-xs text-muted-foreground">—</span>
                      : row.by_type.map(t => (
                        <Badge key={t.leave_type_id} variant="secondary" className="text-xs">
                          {t.leave_type_name}: {t.days_used}d
                        </Badge>
                      ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// ─── Payroll Tab ─────────────────────────────────────────────────────────────

const PAYROLL_STATUS_STYLES: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-600',
  finalized: 'bg-blue-100 text-blue-700',
  paid:      'bg-green-100 text-green-700',
}

function PayrollTab({ year, month, deptId }: { year: number; month: number; deptId?: number }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const { data, isLoading } = usePayrollReport({
    year, month,
    department_id: deptId,
    status: statusFilter === 'all' ? undefined : statusFilter,
  })
  const rows   = data?.data ?? []
  const totals = data?.meta?.totals

  function handleExport() {
    exportCsv(
      ['Employee No', 'Name', 'Department', 'Basic', 'Allowances', 'Overtime', 'Gross', 'Deductions', 'Net', 'Status'],
      rows.map(r => [
        r.employee_number, r.name, r.department ?? '',
        r.basic_salary, r.allowances, r.overtime_pay,
        r.gross_salary, r.total_deductions, r.net_salary, r.status,
      ]),
      `payroll_${year}_${String(month).padStart(2, '0')}.csv`
    )
  }

  return (
    <div className="space-y-4">
      {/* Totals */}
      {totals && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border p-3 bg-card text-center">
            <p className="text-xs text-muted-foreground">Total Gross</p>
            <p className="font-bold text-sm">{IDR(totals.total_gross)}</p>
          </div>
          <div className="rounded-lg border p-3 bg-card text-center">
            <p className="text-xs text-muted-foreground">Total Deductions</p>
            <p className="font-bold text-sm text-red-500">{IDR(totals.total_deductions)}</p>
          </div>
          <div className="rounded-lg border p-3 bg-card text-center col-span-2 sm:col-span-1">
            <p className="text-xs text-muted-foreground">Total Net</p>
            <p className="font-bold text-sm text-emerald-600">{IDR(totals.total_net)}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {totals && (
            <>
              <Badge variant="secondary">{totals.count_draft} Draft</Badge>
              <Badge className="bg-blue-100 text-blue-700">{totals.count_finalized} Finalized</Badge>
              <Badge className="bg-green-100 text-green-700">{totals.count_paid} Paid</Badge>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[130px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="finalized">Finalized</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={handleExport} disabled={rows.length === 0}>
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="text-right">Basic</TableHead>
              <TableHead className="text-right">Gross</TableHead>
              <TableHead className="text-right">Deductions</TableHead>
              <TableHead className="text-right">Net Salary</TableHead>
              <TableHead className="text-center">Attendance</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            )}
            {!isLoading && rows.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No payroll data for this period.</TableCell></TableRow>
            )}
            {rows.map((row: PayrollReportRow) => (
              <TableRow key={row.employee_id}>
                <TableCell>
                  <p className="font-medium text-sm">{row.name}</p>
                  <p className="text-xs text-muted-foreground">{row.employee_number}</p>
                </TableCell>
                <TableCell className="text-sm">{row.department ?? '—'}</TableCell>
                <TableCell className="text-right text-sm">{IDR(row.basic_salary)}</TableCell>
                <TableCell className="text-right text-sm">{IDR(row.gross_salary)}</TableCell>
                <TableCell className="text-right text-sm text-red-500">{IDR(row.total_deductions)}</TableCell>
                <TableCell className="text-right font-semibold text-sm text-emerald-600">{IDR(row.net_salary)}</TableCell>
                <TableCell className="text-center text-xs text-muted-foreground">
                  {row.present_days}P / {row.absent_days}A
                </TableCell>
                <TableCell className="text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${PAYROLL_STATUS_STYLES[row.status] ?? ''}`}>
                    {row.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// ─── Overtime Tab ────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = { regular: 'Regular', weekend: 'Weekend', holiday: 'Holiday' }
const TYPE_COLORS: Record<string, string> = {
  regular: 'bg-blue-100 text-blue-700',
  weekend: 'bg-amber-100 text-amber-700',
  holiday: 'bg-red-100 text-red-700',
}

function OvertimeTab({ year, month, deptId }: { year: number; month: number; deptId?: number }) {
  const { data, isLoading } = useOvertimeReport({ year, month, department_id: deptId })
  const rows = data?.data ?? []
  const meta = data?.meta

  function handleExport() {
    exportCsv(
      ['Employee No', 'Name', 'Department', 'Total Requests', 'Approved Hours', 'Pending Hours'],
      rows.map(r => [r.employee_number, r.name, r.department ?? '', r.total_requests, r.approved_hours, r.pending_hours]),
      `overtime_${year}_${String(month).padStart(2, '0')}.csv`
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      {meta && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border p-3 bg-card text-center">
            <p className="text-xs text-muted-foreground">Employees with OT</p>
            <p className="font-bold text-lg">{meta.total_employees}</p>
          </div>
          <div className="rounded-lg border p-3 bg-card text-center">
            <p className="text-xs text-muted-foreground">Total Approved Hours</p>
            <p className="font-bold text-lg text-emerald-600">{meta.total_approved_hours}h</p>
          </div>
          <div className="rounded-lg border p-3 bg-card text-center col-span-2 sm:col-span-1">
            <p className="text-xs text-muted-foreground">Pending Requests</p>
            <p className="font-bold text-lg text-amber-600">{meta.total_pending}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{rows.length} employee(s) with overtime this period</p>
        <Button size="sm" variant="outline" onClick={handleExport} disabled={rows.length === 0}>
          <Download className="w-4 h-4 mr-1" /> Export CSV
        </Button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="text-center">Total Requests</TableHead>
              <TableHead className="text-center">Approved Hours</TableHead>
              <TableHead className="text-center">Pending Hours</TableHead>
              <TableHead>Breakdown</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            )}
            {!isLoading && rows.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No overtime data for this period.</TableCell></TableRow>
            )}
            {rows.map((row: OvertimeReportRow) => (
              <TableRow key={row.employee_id}>
                <TableCell>
                  <p className="font-medium text-sm">{row.name}</p>
                  <p className="text-xs text-muted-foreground">{row.employee_number}</p>
                </TableCell>
                <TableCell className="text-sm">{row.department ?? '—'}</TableCell>
                <TableCell className="text-center text-sm">{row.total_requests}</TableCell>
                <TableCell className="text-center">
                  <span className="text-sm font-semibold text-emerald-600">{row.approved_hours}h</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm font-semibold text-amber-600">{row.pending_hours}h</span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {row.by_type.length === 0
                      ? <span className="text-xs text-muted-foreground">—</span>
                      : row.by_type.map(t => (
                        <Badge key={t.type} className={`text-xs border-0 ${TYPE_COLORS[t.type] ?? 'bg-slate-100 text-slate-600'}`}>
                          {TYPE_LABELS[t.type] ?? t.type}: {t.total_hours}h
                        </Badge>
                      ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
  const [year, setYear]   = useState(CURRENT_YEAR)
  const [month, setMonth] = useState(CURRENT_MONTH)
  const [deptId, setDeptId] = useState<number | undefined>()

  const { data: overviewData } = useOverview()
  const { data: deptData }     = useDepartments()
  const ov = overviewData?.data

  return (
    <DashboardLayout title="Reports" allowedRoles={['admin', 'hr', 'manager', 'director']}>
      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users}       label="Total Employees"  value={ov?.total_employees ?? '—'} color="bg-blue-100 text-blue-600" />
          <StatCard icon={Clock}       label="Present Today"    value={ov?.today.present ?? '—'} sub={`${ov?.today.late ?? 0} late`} color="bg-emerald-100 text-emerald-600" />
          <StatCard icon={AlertCircle} label="Pending Leaves"   value={ov?.pending_leaves ?? '—'} color="bg-amber-100 text-amber-600" />
          <StatCard icon={Receipt}     label="Payroll (Month)"  value={ov ? IDR(ov.payroll.total_net) : '—'} sub={`${ov?.payroll.total_records ?? 0} records`} color="bg-purple-100 text-purple-600" />
        </div>

        {/* Global Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filter:</span>
          </div>
          <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select
            value={deptId ? String(deptId) : 'all'}
            onValueChange={v => setDeptId(v === 'all' ? undefined : Number(v))}
          >
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Departments" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {deptData?.data?.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="attendance">
          <TabsList>
            <TabsTrigger value="attendance" className="gap-2">
              <Clock className="w-4 h-4" /> Attendance
            </TabsTrigger>
            <TabsTrigger value="leave" className="gap-2">
              <CalendarDays className="w-4 h-4" /> Leave
            </TabsTrigger>
            <TabsTrigger value="payroll" className="gap-2">
              <Receipt className="w-4 h-4" /> Payroll
            </TabsTrigger>
            <TabsTrigger value="overtime" className="gap-2">
              <Timer className="w-4 h-4" /> Overtime
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="mt-4">
            <AttendanceTab year={year} month={month} deptId={deptId} />
          </TabsContent>

          <TabsContent value="leave" className="mt-4">
            <LeaveTab year={year} deptId={deptId} />
          </TabsContent>

          <TabsContent value="payroll" className="mt-4">
            <PayrollTab year={year} month={month} deptId={deptId} />
          </TabsContent>

          <TabsContent value="overtime" className="mt-4">
            <OvertimeTab year={year} month={month} deptId={deptId} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
