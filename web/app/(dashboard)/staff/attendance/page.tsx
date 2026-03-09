'use client'

import { useState } from 'react'
import { Clock, LogIn, LogOut, ChevronLeft, ChevronRight, Calendar, ScanFace } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import {
  useCheckIn,
  useCheckOut,
  useMyAttendance,
  useTodayAttendance,
} from '@/hooks/use-attendance'
import { FaceCheckinDialog } from './face-checkin-dialog'
import type { AttendanceFilters } from '@/types/attendance'

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  present:  { label: 'Present',  className: 'bg-emerald-100 text-emerald-700' },
  late:     { label: 'Late',     className: 'bg-amber-100 text-amber-700' },
  absent:   { label: 'Absent',   className: 'bg-red-100 text-red-700' },
  half_day: { label: 'Half Day', className: 'bg-blue-100 text-blue-700' },
  on_leave: { label: 'On Leave', className: 'bg-purple-100 text-purple-700' },
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function LiveClock() {
  const now = new Date()
  const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const date = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <div className="text-center">
      <p className="text-4xl font-bold tabular-nums tracking-tight">{time}</p>
      <p className="text-muted-foreground text-sm mt-1">{date}</p>
    </div>
  )
}

export default function StaffAttendancePage() {
  const [filters, setFilters] = useState<AttendanceFilters>({ page: 1, per_page: 10 })
  const [faceDialog, setFaceDialog] = useState<{ open: boolean; action: 'check_in' | 'check_out' }>({
    open: false,
    action: 'check_in',
  })

  const { data: todayRecord, isLoading: loadingToday } = useTodayAttendance()
  const { data: historyData, isLoading: loadingHistory } = useMyAttendance(filters)
  const checkInMutation  = useCheckIn()
  const checkOutMutation = useCheckOut()

  const history = historyData?.data ?? []
  const meta    = historyData?.meta

  const canCheckIn  = !loadingToday && !todayRecord
  const canCheckOut = !loadingToday && !!todayRecord && !todayRecord.check_out

  return (
    <DashboardLayout title="My Attendance">
      <div className="space-y-6">
        {/* Check-in Card */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
              {/* Clock */}
              <div className="flex flex-col items-center justify-center py-8 px-6 bg-slate-50">
                <Clock className="w-8 h-8 text-primary mb-3" />
                <LiveClock />
              </div>

              {/* Today Status */}
              <div className="flex flex-col items-center justify-center py-8 px-6 space-y-4">
                {loadingToday ? (
                  <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                ) : todayRecord ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_STYLES[todayRecord.status]?.className}`}
                      >
                        {STATUS_STYLES[todayRecord.status]?.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-6 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Check In</p>
                        <p className="text-xl font-bold tabular-nums">{formatTime(todayRecord.check_in)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Check Out</p>
                        <p className="text-xl font-bold tabular-nums">{formatTime(todayRecord.check_out)}</p>
                      </div>
                    </div>
                    {todayRecord.work_hours && (
                      <p className="text-sm text-muted-foreground">
                        Work hours: <span className="font-semibold text-foreground">{todayRecord.work_hours}h</span>
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">No attendance record for today.</p>
                )}

                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  <Button
                    size="lg"
                    className="gap-2"
                    disabled={!canCheckIn || checkInMutation.isPending}
                    onClick={() => checkInMutation.mutate()}
                  >
                    <LogIn className="w-4 h-4" />
                    Check In
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2"
                    disabled={!canCheckOut || checkOutMutation.isPending}
                    onClick={() => checkOutMutation.mutate()}
                  >
                    <LogOut className="w-4 h-4" />
                    Check Out
                  </Button>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-2"
                    disabled={!canCheckIn}
                    onClick={() => setFaceDialog({ open: true, action: 'check_in' })}
                  >
                    <ScanFace className="w-4 h-4" />
                    Face Check-In
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-2"
                    disabled={!canCheckOut}
                    onClick={() => setFaceDialog({ open: true, action: 'check_out' })}
                  >
                    <ScanFace className="w-4 h-4" />
                    Face Check-Out
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Attendance History
              </CardTitle>
              <Select
                defaultValue="all"
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, status: v === 'all' ? undefined : v, page: 1 }))
                }
              >
                <SelectTrigger className="w-36 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Work Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingHistory ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No attendance records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell className="text-sm">{formatDate(rec.date)}</TableCell>
                      <TableCell className="font-mono text-sm">{formatTime(rec.check_in)}</TableCell>
                      <TableCell className="font-mono text-sm">{formatTime(rec.check_out)}</TableCell>
                      <TableCell className="text-sm">
                        {rec.work_hours ? `${rec.work_hours}h` : '—'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[rec.status]?.className}`}>
                          {STATUS_STYLES[rec.status]?.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{rec.notes ?? '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground">
                <span>
                  {(meta.current_page - 1) * meta.per_page + 1}–
                  {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total}
                </span>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7"
                    disabled={meta.current_page <= 1}
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7"
                    disabled={meta.current_page >= meta.last_page}
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <FaceCheckinDialog
        open={faceDialog.open}
        action={faceDialog.action}
        onOpenChange={open => setFaceDialog(d => ({ ...d, open }))}
      />
    </DashboardLayout>
  )
}
