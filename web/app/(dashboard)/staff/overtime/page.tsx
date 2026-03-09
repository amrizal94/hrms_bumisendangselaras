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
import { useCancelOvertime, useMyOvertimes } from '@/hooks/use-overtime'
import { SubmitOvertimeDialog } from './submit-overtime-dialog'
import type { OvertimeFilters, OvertimeRequest } from '@/types/overtime'

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending:   { label: 'Pending',   className: 'bg-amber-100 text-amber-700' },
  approved:  { label: 'Approved',  className: 'bg-emerald-100 text-emerald-700' },
  rejected:  { label: 'Rejected',  className: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', className: 'bg-slate-100 text-slate-500' },
}

const TYPE_LABELS: Record<string, string> = {
  regular: 'Regular',
  weekend: 'Weekend',
  holiday: 'Holiday',
}

export default function StaffOvertimePage() {
  const [filters, setFilters]           = useState<OvertimeFilters>({ page: 1, per_page: 10 })
  const [submitOpen, setSubmitOpen]     = useState(false)
  const [cancelTarget, setCancelTarget] = useState<OvertimeRequest | null>(null)

  const { data: overtimeData, isLoading } = useMyOvertimes(filters)
  const cancelMutation = useCancelOvertime()

  const overtimes = overtimeData?.data ?? []
  const meta      = overtimeData?.meta

  return (
    <DashboardLayout title="My Overtime">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Overtime</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Manage your overtime requests</p>
          </div>
          <Button onClick={() => setSubmitOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Submit Overtime
          </Button>
        </div>

        {/* Overtime History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Overtime History</CardTitle>
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
                  <TableHead>Date</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reviewed By</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : overtimes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      No overtime requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  overtimes.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {new Date(req.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{req.overtime_hours}h</TableCell>
                      <TableCell>
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                          {TYPE_LABELS[req.overtime_type]}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-48 truncate">
                        {req.reason}
                      </TableCell>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => setCancelTarget(req)}
                          >
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

      <SubmitOvertimeDialog open={submitOpen} onOpenChange={setSubmitOpen} />

      <AlertDialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Overtime Request</AlertDialogTitle>
            <AlertDialogDescription>
              Cancel your overtime request for{' '}
              {cancelTarget && new Date(cancelTarget.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              {' '}({cancelTarget?.overtime_hours}h)?
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
