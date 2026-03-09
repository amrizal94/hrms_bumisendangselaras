'use client'

import { useState } from 'react'
import { Users, Clock, UserX, AlertCircle, Search, ChevronLeft, ChevronRight, Pencil, Trash2, Plus, QrCode, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAttendance, useAttendanceSummary, useDeleteAttendance } from '@/hooks/use-attendance'
import { useDepartments } from '@/hooks/use-employees'
import { EditAttendanceDialog } from './edit-attendance-dialog'
import { AddAttendanceDialog } from './add-attendance-dialog'
import { QrSessionDialog } from './qr-session-dialog'
import { AttendanceDetailSheet } from '@/components/attendance/attendance-detail-sheet'
import type { AttendanceFilters, AttendanceRecord } from '@/types/attendance'

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  present:  { label: 'Present',  className: 'bg-emerald-100 text-emerald-700' },
  late:     { label: 'Late',     className: 'bg-amber-100 text-amber-700' },
  absent:   { label: 'Absent',   className: 'bg-red-100 text-red-700' },
  half_day: { label: 'Half Day', className: 'bg-blue-100 text-blue-700' },
  on_leave: { label: 'On Leave', className: 'bg-purple-100 text-purple-700' },
}

const METHOD_STYLES: Record<string, { label: string; className: string }> = {
  face:   { label: 'Face',   className: 'bg-emerald-100 text-emerald-700' },
  manual: { label: 'Manual', className: 'bg-slate-100 text-slate-600' },
  admin:  { label: 'Admin',  className: 'bg-indigo-100 text-indigo-700' },
  qr:     { label: 'QR',     className: 'bg-amber-100 text-amber-700' },
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function SummaryCard({ label, value, icon: Icon, color }: {
  label: string; value: number | undefined; icon: React.ElementType; color: string
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value ?? '—'}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminAttendancePage() {
  const [filters, setFilters] = useState<AttendanceFilters>({
    date: todayStr(),
    page: 1,
    per_page: 20,
  })
  const [search, setSearch]             = useState('')
  const [addOpen, setAddOpen]           = useState(false)
  const [qrOpen, setQrOpen]             = useState(false)
  const [editRecord, setEditRecord]     = useState<AttendanceRecord | null>(null)
  const [deleteRecord, setDeleteRecord] = useState<AttendanceRecord | null>(null)
  const [detailRecord, setDetailRecord] = useState<AttendanceRecord | null>(null)

  const { data: summaryData } = useAttendanceSummary(filters.date)
  const { data, isLoading }   = useAttendance(filters)
  const { data: deptData }    = useDepartments()
  const deleteMutation        = useDeleteAttendance()

  const records     = data?.data ?? []
  const meta        = data?.meta
  const departments = deptData?.data ?? []

  function applySearch() {
    setFilters((f) => ({ ...f, search: search || undefined, page: 1 }))
  }

  return (
    <DashboardLayout title="Attendance" allowedRoles={['admin', 'hr', 'manager', 'director']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Monitor daily attendance records</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" onClick={() => setQrOpen(true)}>
              <QrCode className="w-4 h-4 mr-2" />
              Generate QR
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard label="Total Employees" value={summaryData?.total_employees} icon={Users}     color="bg-blue-50 text-blue-600" />
          <SummaryCard label="Present Today"   value={summaryData?.present}         icon={Clock}     color="bg-emerald-50 text-emerald-600" />
          <SummaryCard label="Late"            value={summaryData?.late}            icon={AlertCircle} color="bg-amber-50 text-amber-600" />
          <SummaryCard label="Absent"          value={summaryData?.absent}          icon={UserX}     color="bg-red-50 text-red-600" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Input
            type="date"
            className="w-40"
            value={filters.date ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value || undefined, page: 1 }))}
          />

          <div className="flex gap-2 flex-1 min-w-52">
            <Input
              placeholder="Search by employee name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
              className="flex-1"
            />
            <Button variant="outline" size="icon" onClick={applySearch}>
              <Search className="w-4 h-4" />
            </Button>
          </div>

          <Select defaultValue="all" onValueChange={(v) =>
            setFilters((f) => ({ ...f, department_id: v === 'all' ? undefined : v, page: 1 }))
          }>
            <SelectTrigger className="w-44"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select defaultValue="all" onValueChange={(v) =>
            setFilters((f) => ({ ...f, status: v === 'all' ? undefined : v, page: 1 }))
          }>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Work Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    No attendance records found.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((rec) => (
                  <TableRow key={rec.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{rec.employee?.user.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{rec.employee?.employee_number}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{rec.employee?.department?.name ?? '—'}</TableCell>
                    <TableCell className="text-sm">{rec.date}</TableCell>
                    <TableCell className="font-mono text-sm">{formatTime(rec.check_in)}</TableCell>
                    <TableCell className="font-mono text-sm">{formatTime(rec.check_out)}</TableCell>
                    <TableCell className="text-sm">{rec.work_hours ? `${rec.work_hours}h` : '—'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[rec.status]?.className}`}>
                        {STATUS_STYLES[rec.status]?.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      {rec.check_in_method ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${METHOD_STYLES[rec.check_in_method]?.className}`}>
                          {METHOD_STYLES[rec.check_in_method]?.label}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"
                          title="Lihat detail & lokasi"
                          onClick={() => setDetailRecord(rec)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => setEditRecord(rec)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteRecord(rec)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {(meta.current_page - 1) * meta.per_page + 1}–
              {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8"
                disabled={meta.current_page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span>{meta.current_page} / {meta.last_page}</span>
              <Button variant="outline" size="icon" className="h-8 w-8"
                disabled={meta.current_page >= meta.last_page}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Attendance Detail Sheet */}
      <AttendanceDetailSheet
        record={detailRecord}
        open={!!detailRecord}
        onOpenChange={(open) => !open && setDetailRecord(null)}
      />

      {/* QR Session Dialog */}
      <QrSessionDialog open={qrOpen} onOpenChange={setQrOpen} />

      {/* Add Entry Dialog */}
      <AddAttendanceDialog
        open={addOpen}
        defaultDate={filters.date}
        onOpenChange={setAddOpen}
      />

      {/* Edit Dialog */}
      <EditAttendanceDialog
        record={editRecord}
        onOpenChange={(open) => !open && setEditRecord(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRecord} onOpenChange={(open) => !open && setDeleteRecord(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attendance Record</AlertDialogTitle>
            <AlertDialogDescription>
              Delete attendance record for{' '}
              <span className="font-semibold text-foreground">{deleteRecord?.employee?.user.name}</span>{' '}
              on <span className="font-semibold text-foreground">{deleteRecord?.date}</span>?
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteRecord) {
                  deleteMutation.mutate(deleteRecord.id, {
                    onSuccess: () => setDeleteRecord(null),
                  })
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
