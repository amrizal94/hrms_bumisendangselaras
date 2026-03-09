'use client'

import { useState } from 'react'
import { Plus, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useCancelLeave, useLeaveQuota, useMyLeaves } from '@/hooks/use-leave'
import { ApplyLeaveDialog } from './apply-leave-dialog'
import type { LeaveFilters, LeaveRequest } from '@/types/leave'

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending:   { label: 'Pending',   className: 'bg-amber-100 text-amber-700' },
  approved:  { label: 'Approved',  className: 'bg-emerald-100 text-emerald-700' },
  rejected:  { label: 'Rejected',  className: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', className: 'bg-slate-100 text-slate-500' },
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  const e = new Date(end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  return start === end ? e : `${s} – ${e}`
}

export default function StaffLeavePage() {
  const [filters, setFilters]         = useState<LeaveFilters>({ page: 1, per_page: 10 })
  const [applyOpen, setApplyOpen]     = useState(false)
  const [cancelTarget, setCancelTarget] = useState<LeaveRequest | null>(null)

  const { data: quotaData, isLoading: loadingQuota } = useLeaveQuota()
  const { data: leavesData, isLoading: loadingLeaves } = useMyLeaves(filters)
  const cancelMutation = useCancelLeave()

  const quotas  = quotaData ?? []
  const leaves  = leavesData?.data ?? []
  const meta    = leavesData?.meta

  return (
    <DashboardLayout title="My Leave">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Leave</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Manage your leave requests</p>
          </div>
          <Button onClick={() => setApplyOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Apply Leave
          </Button>
        </div>

        {/* Leave Quota Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {loadingQuota
            ? Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}><CardContent className="p-4"><div className="h-12 bg-muted animate-pulse rounded" /></CardContent></Card>
              ))
            : quotas.map((q) => (
                <Card key={q.leave_type.id} className="text-center">
                  <CardContent className="p-4">
                    <p className="text-2xl font-bold">{q.remaining}</p>
                    <p className="text-xs text-muted-foreground leading-tight mt-1">{q.leave_type.name}</p>
                    <p className="text-xs text-muted-foreground">{q.used_days}/{q.max_days} used</p>
                    {!q.leave_type.is_paid && (
                      <span className="text-xs text-amber-600">unpaid</span>
                    )}
                  </CardContent>
                </Card>
              ))}
        </div>

        {/* Leave History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Leave History</CardTitle>
              <Select defaultValue="all" onValueChange={(v) =>
                setFilters((f) => ({ ...f, status: v === 'all' ? undefined : v, page: 1 }))
              }>
                <SelectTrigger className="w-36 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingLeaves ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : leaves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      No leave requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  leaves.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{req.leave_type?.name}</p>
                          <span className={`text-xs ${req.leave_type?.is_paid ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {req.leave_type?.is_paid ? 'paid' : 'unpaid'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{formatDateRange(req.start_date, req.end_date)}</TableCell>
                      <TableCell className="text-sm font-medium">{req.total_days}d</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-48 truncate">{req.reason}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[req.status]?.className}`}>
                          {STATUS_STYLES[req.status]?.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {req.status === 'rejected' && req.rejection_reason
                          ? req.rejection_reason
                          : req.status === 'approved' && req.approved_by
                          ? `by ${req.approved_by.name}`
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {req.status === 'pending' && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => setCancelTarget(req)}>
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {meta && meta.last_page > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground">
                <span>{(meta.current_page - 1) * meta.per_page + 1}–{Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total}</span>
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

      <ApplyLeaveDialog open={applyOpen} onOpenChange={setApplyOpen} />

      <AlertDialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Leave Request</AlertDialogTitle>
            <AlertDialogDescription>
              Cancel your {cancelTarget?.leave_type?.name} request for{' '}
              {cancelTarget && formatDateRange(cancelTarget.start_date, cancelTarget.end_date)}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => cancelTarget && cancelMutation.mutate(cancelTarget.id, {
                onSuccess: () => setCancelTarget(null),
              })}
            >
              Cancel Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
