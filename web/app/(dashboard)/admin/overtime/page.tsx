'use client'

import { useState } from 'react'
import { Search, Check, X, ChevronLeft, ChevronRight, Clock, CheckCircle, Timer, FileText } from 'lucide-react'
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
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useApproveOvertime, useOvertimes, useOvertimeSummary } from '@/hooks/use-overtime'
import { useDepartments } from '@/hooks/use-employees'
import { RejectDialog } from './reject-dialog'
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

function SummaryCard({ label, value, icon: Icon, color }: {
  label: string; value: number | string; icon: React.ElementType; color: string
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminOvertimePage() {
  const [filters, setFilters]           = useState<OvertimeFilters>({ page: 1, per_page: 15 })
  const [search, setSearch]             = useState('')
  const [rejectTarget, setRejectTarget] = useState<OvertimeRequest | null>(null)

  const { data, isLoading }   = useOvertimes(filters)
  const { data: summary }     = useOvertimeSummary()
  const { data: deptData }    = useDepartments()
  const approveMutation       = useApproveOvertime()

  const requests    = data?.data ?? []
  const meta        = data?.meta
  const departments = deptData?.data ?? []

  function applySearch() {
    setFilters((f) => ({ ...f, search: search || undefined, page: 1 }))
  }

  return (
    <DashboardLayout title="Overtime Management" allowedRoles={['admin', 'hr', 'manager', 'director']}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overtime Management</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Review and manage employee overtime requests</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard label="Total Requests" value={summary?.total ?? 0}        icon={FileText}    color="bg-blue-50 text-blue-600" />
          <SummaryCard label="Pending"         value={summary?.pending ?? 0}      icon={Clock}       color="bg-amber-50 text-amber-600" />
          <SummaryCard label="Approved"        value={summary?.approved ?? 0}     icon={CheckCircle} color="bg-emerald-50 text-emerald-600" />
          <SummaryCard label="Approved Hours"  value={`${summary?.total_hours ?? 0}h`} icon={Timer}      color="bg-purple-50 text-purple-600" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
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
            setFilters((f) => ({ ...f, status: v === 'all' ? undefined : v, page: 1 }))
          }>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

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
            setFilters((f) => ({ ...f, overtime_type: v === 'all' ? undefined : v, page: 1 }))
          }>
            <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="weekend">Weekend</SelectItem>
              <SelectItem value="holiday">Holiday</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            className="w-40"
            placeholder="Date from"
            onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value || undefined, page: 1 }))}
          />
          <Input
            type="date"
            className="w-40"
            placeholder="Date to"
            onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value || undefined, page: 1 }))}
          />
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approved By</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    No overtime requests found.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow key={req.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{req.employee?.user.name}</p>
                        <p className="text-xs text-muted-foreground">{req.employee?.position}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{req.employee?.department?.name ?? '—'}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {new Date(req.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{req.overtime_hours}h</TableCell>
                    <TableCell>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        {TYPE_LABELS[req.overtime_type]}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-40 truncate">
                      {req.reason}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[req.status]?.className}`}>
                        {STATUS_STYLES[req.status]?.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {req.approved_by?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {req.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            className="h-7 px-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={approveMutation.isPending}
                            onClick={() => approveMutation.mutate(req.id)}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-destructive border-destructive/40 hover:bg-destructive/5"
                            onClick={() => setRejectTarget(req)}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
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
              {(meta.current_page - 1) * meta.per_page + 1}–
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

      <RejectDialog
        request={rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
      />
    </DashboardLayout>
  )
}
