'use client'

import { useState } from 'react'
import { Search, Check, X, ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, FileText, Pencil } from 'lucide-react'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useApproveLeave, useLeaves, useLeaveTypes, useUpdateLeaveType } from '@/hooks/use-leave'
import { useDepartments } from '@/hooks/use-employees'
import { RejectDialog } from './reject-dialog'
import type { LeaveFilters, LeaveRequest, LeaveType } from '@/types/leave'

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending:   { label: 'Pending',   className: 'bg-amber-100 text-amber-700' },
  approved:  { label: 'Approved',  className: 'bg-emerald-100 text-emerald-700' },
  rejected:  { label: 'Rejected',  className: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', className: 'bg-slate-100 text-slate-500' },
}

function SummaryCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ElementType; color: string
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

function formatDateRange(start: string, end: string, days: number): string {
  const s = new Date(start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  const e = new Date(end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  const range = start === end ? e : `${s} – ${e}`
  return `${range} (${days}d)`
}

// ── Edit Leave Type Dialog ─────────────────────────────────────────────────
function EditLeaveTypeDialog({
  leaveType,
  onOpenChange,
}: {
  leaveType: LeaveType | null
  onOpenChange: (open: boolean) => void
}) {
  const [maxDays, setMaxDays]   = useState(leaveType?.max_days_per_year ?? 12)
  const [isActive, setIsActive] = useState(leaveType?.is_active ?? true)
  const updateMutation          = useUpdateLeaveType()

  // Sync state when target changes
  if (leaveType && leaveType.max_days_per_year !== maxDays && !updateMutation.isPending) {
    setMaxDays(leaveType.max_days_per_year)
    setIsActive(leaveType.is_active)
  }

  function handleSave() {
    if (!leaveType) return
    updateMutation.mutate(
      { id: leaveType.id, data: { max_days_per_year: maxDays, is_active: isActive } },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={!!leaveType} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Leave Type</DialogTitle>
        </DialogHeader>
        {leaveType && (
          <div className="space-y-5 py-2">
            <div>
              <p className="text-sm font-medium">{leaveType.name}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{leaveType.code}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-days">Max Days per Year</Label>
              <Input
                id="max-days"
                type="number"
                min={1}
                max={365}
                value={maxDays}
                onChange={(e) => setMaxDays(Number(e.target.value))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is-active">Active</Label>
              <Switch
                id="is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Leave Types Tab ────────────────────────────────────────────────────────
function LeaveTypesTab() {
  const { data: leaveTypes = [], isLoading } = useLeaveTypes()
  const [editTarget, setEditTarget]          = useState<LeaveType | null>(null)

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Configure quota (max days per year) for each leave type. Changes apply to all employees.
      </p>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Leave Type</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Max Days / Year</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16 text-right">Edit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : leaveTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  No leave types found.
                </TableCell>
              </TableRow>
            ) : (
              leaveTypes.map((t) => (
                <TableRow key={t.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-sm">{t.name}</TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 rounded bg-muted text-xs font-mono">{t.code}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-primary">{t.max_days_per_year}</span>
                    <span className="text-xs text-muted-foreground ml-1">days</span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium ${t.is_paid ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {t.is_paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {t.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditTarget(t)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EditLeaveTypeDialog
        leaveType={editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      />
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AdminLeavePage() {
  const [activeTab, setActiveTab]           = useState<'requests' | 'types'>('requests')
  const [filters, setFilters]               = useState<LeaveFilters>({ page: 1, per_page: 15 })
  const [search, setSearch]                 = useState('')
  const [rejectTarget, setRejectTarget]     = useState<LeaveRequest | null>(null)

  const { data, isLoading }  = useLeaves(filters)
  const { data: deptData }   = useDepartments()
  const { data: typesData }  = useLeaveTypes()
  const approveMutation      = useApproveLeave()

  const requests    = data?.data ?? []
  const meta        = data?.meta
  const departments = deptData?.data ?? []
  const leaveTypes  = typesData ?? []

  const pending   = requests.filter((r) => r.status === 'pending').length
  const approved  = requests.filter((r) => r.status === 'approved').length
  const rejected  = requests.filter((r) => r.status === 'rejected').length

  function applySearch() {
    setFilters((f) => ({ ...f, search: search || undefined, page: 1 }))
  }

  return (
    <DashboardLayout title="Leave Management" allowedRoles={['admin', 'hr', 'manager', 'director']}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Review and manage employee leave requests</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard label="Total Requests"  value={meta?.total ?? 0} icon={FileText}    color="bg-blue-50 text-blue-600" />
          <SummaryCard label="Pending"          value={pending}          icon={Clock}       color="bg-amber-50 text-amber-600" />
          <SummaryCard label="Approved"         value={approved}         icon={CheckCircle} color="bg-emerald-50 text-emerald-600" />
          <SummaryCard label="Rejected"         value={rejected}         icon={XCircle}     color="bg-red-50 text-red-600" />
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 border-b">
          {(['requests', 'types'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'requests' ? 'Leave Requests' : 'Leave Types'}
            </button>
          ))}
        </div>

        {/* ── Tab: Leave Requests ── */}
        {activeTab === 'requests' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="flex gap-2 flex-1 min-w-52">
                <Input placeholder="Search by employee name..."
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
                setFilters((f) => ({ ...f, leave_type_id: v === 'all' ? undefined : v, page: 1 }))
              }>
                <SelectTrigger className="w-40"><SelectValue placeholder="Leave Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {leaveTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                  ))}
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
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reviewed By</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((__, j) => (
                          <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        No leave requests found.
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
                        <TableCell>
                          <div>
                            <p className="text-sm">{req.leave_type?.name}</p>
                            <span className={`text-xs ${req.leave_type?.is_paid ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {req.leave_type?.is_paid ? 'paid' : 'unpaid'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {formatDateRange(req.start_date, req.end_date, req.total_days)}
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
          </>
        )}

        {/* ── Tab: Leave Types ── */}
        {activeTab === 'types' && <LeaveTypesTab />}
      </div>

      <RejectDialog
        request={rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
      />
    </DashboardLayout>
  )
}
