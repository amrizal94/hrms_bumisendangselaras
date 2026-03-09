'use client'

import { useState } from 'react'
import { Check, X, Receipt, ChevronLeft, ChevronRight, Search, Pencil } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import {
  useApproveExpense,
  useExpenses,
  useExpenseTypes,
  useRejectExpense,
  useUpdateExpenseType,
} from '@/hooks/use-expenses'
import type { Expense, ExpenseFilters, ExpenseType } from '@/types/expense'

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending:  { label: 'Pending',  className: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
}

function fmtCurrency(v: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v)
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Edit Expense Type Dialog ────────────────────────────────────────────────
function EditExpenseTypeDialog({
  expenseType,
  onOpenChange,
}: {
  expenseType: ExpenseType | null
  onOpenChange: (open: boolean) => void
}) {
  const [isActive, setIsActive] = useState(expenseType?.is_active ?? true)
  const updateMutation          = useUpdateExpenseType()

  if (expenseType && expenseType.is_active !== isActive && !updateMutation.isPending) {
    setIsActive(expenseType.is_active)
  }

  function handleSave() {
    if (!expenseType) return
    updateMutation.mutate(
      { id: expenseType.id, data: { is_active: isActive } },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={!!expenseType} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Expense Type</DialogTitle>
        </DialogHeader>
        {expenseType && (
          <div className="space-y-5 py-2">
            <div>
              <p className="text-sm font-medium">{expenseType.name}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{expenseType.code}</p>
              {expenseType.description && (
                <p className="text-xs text-muted-foreground mt-1">{expenseType.description}</p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="et-active">Active</Label>
              <Switch
                id="et-active"
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

// ── Expense Types Tab ───────────────────────────────────────────────────────
function ExpenseTypesTab() {
  const { data: expenseTypes = [], isLoading } = useExpenseTypes(true)
  const [editTarget, setEditTarget]            = useState<ExpenseType | null>(null)

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Manage expense categories available to employees when submitting reimbursement claims.
      </p>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Expense Type</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16 text-right">Edit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : expenseTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  No expense types found.
                </TableCell>
              </TableRow>
            ) : (
              expenseTypes.map((t) => (
                <TableRow key={t.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-sm">{t.name}</TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 rounded bg-muted text-xs font-mono">{t.code}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {t.description ?? '—'}
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

      <EditExpenseTypeDialog
        expenseType={editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      />
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function AdminExpensesPage() {
  const [activeTab, setActiveTab]           = useState<'approvals' | 'types'>('approvals')
  const [filters, setFilters]               = useState<ExpenseFilters>({ page: 1, per_page: 15 })
  const [search, setSearch]                 = useState('')
  const [rejectTarget, setRejectTarget]     = useState<Expense | null>(null)
  const [rejectReason, setRejectReason]     = useState('')

  const { data, isLoading }    = useExpenses(filters)
  const { data: expenseTypes } = useExpenseTypes()
  const approveMutation        = useApproveExpense()
  const rejectMutation         = useRejectExpense()

  const expenses = data?.data ?? []
  const meta     = data?.meta

  const pending  = expenses.filter((e) => e.status === 'pending').length
  const approved = expenses.filter((e) => e.status === 'approved').length
  const rejected = expenses.filter((e) => e.status === 'rejected').length

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setFilters((f) => ({ ...f, search: search || undefined, page: 1 }))
  }

  return (
    <DashboardLayout title="Expense Approvals" allowedRoles={['admin', 'hr', 'manager', 'director']}>
      <div className="space-y-4">
        {/* Tab switcher */}
        <div className="flex gap-1 border-b">
          {(['approvals', 'types'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'approvals' ? 'Expense Approvals' : 'Expense Types'}
            </button>
          ))}
        </div>

        {/* ── Tab: Expense Types ── */}
        {activeTab === 'types' && <ExpenseTypesTab />}

        {/* ── Tab: Expense Approvals ── */}
        {activeTab === 'approvals' && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Pending',  value: pending,  color: 'bg-amber-50 text-amber-700' },
                { label: 'Approved', value: approved, color: 'bg-emerald-50 text-emerald-700' },
                { label: 'Rejected', value: rejected, color: 'bg-red-50 text-red-700' },
              ].map((c) => (
                <Card key={c.label}>
                  <CardContent className={`p-4 text-center rounded-lg ${c.color}`}>
                    <p className="text-2xl font-bold">{c.value}</p>
                    <p className="text-xs font-medium">{c.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="Search employee…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-48"
                />
                <Button type="submit" size="sm" variant="outline">
                  <Search className="w-4 h-4" />
                </Button>
              </form>

              <Select
                value={(filters.status as string) ?? 'all'}
                onValueChange={(v) => setFilters((f) => ({ ...f, status: v === 'all' ? undefined : v, page: 1 }))}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={(filters.category as string) ?? 'all'}
                onValueChange={(v) => setFilters((f) => ({ ...f, category: v === 'all' ? undefined : v, page: 1 }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {(expenseTypes ?? []).map((t) => (
                    <SelectItem key={t.code} value={t.code}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                className="w-40"
                value={filters.date_from ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value || undefined, page: 1 }))}
              />
              <Input
                type="date"
                className="w-40"
                value={filters.date_to ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value || undefined, page: 1 }))}
              />
            </div>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Loading…
                        </TableCell>
                      </TableRow>
                    )}
                    {!isLoading && expenses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No expenses found.
                        </TableCell>
                      </TableRow>
                    )}
                    {expenses.map((exp) => {
                      const st = STATUS_STYLES[exp.status] ?? STATUS_STYLES.pending
                      return (
                        <TableRow key={exp.id}>
                          <TableCell>
                            <p className="font-medium">{exp.employee?.user.name ?? '—'}</p>
                            <p className="text-xs text-muted-foreground">{exp.employee?.department?.name}</p>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{fmtDate(exp.expense_date)}</TableCell>
                          <TableCell className="capitalize">
                            {exp.expense_type?.name ?? exp.category}
                          </TableCell>
                          <TableCell className="max-w-[160px] truncate" title={exp.description}>
                            {exp.description}
                          </TableCell>
                          <TableCell className="text-right font-medium">{fmtCurrency(exp.amount)}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.className}`}>
                              {st.label}
                            </span>
                            {exp.status === 'rejected' && exp.rejection_reason && (
                              <p className="text-xs text-red-500 mt-0.5 max-w-[120px] truncate" title={exp.rejection_reason}>
                                {exp.rejection_reason}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            {exp.receipt_url && (
                              <a href={exp.receipt_url} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" variant="ghost" className="h-7 px-2">
                                  <Receipt className="w-3.5 h-3.5" />
                                </Button>
                              </a>
                            )}
                          </TableCell>
                          <TableCell>
                            {exp.status === 'pending' && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  className="h-7 px-2 bg-emerald-600 hover:bg-emerald-700"
                                  disabled={approveMutation.isPending}
                                  onClick={() => approveMutation.mutate(exp.id)}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-red-600 border-red-300 hover:bg-red-50"
                                  onClick={() => { setRejectTarget(exp); setRejectReason('') }}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {meta.current_page} of {meta.last_page} ({meta.total} total)
                </p>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={meta.current_page <= 1}
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={meta.current_page >= meta.last_page}
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Reject dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(v) => { if (!v) setRejectTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Reject expense of{' '}
              <span className="font-medium">{rejectTarget ? fmtCurrency(rejectTarget.amount) : ''}</span>
              {' '}from <span className="font-medium">{rejectTarget?.employee?.user.name}</span>?
            </p>
            <div className="space-y-1">
              <Label>Rejection Reason</Label>
              <Textarea
                rows={3}
                placeholder="State the reason…"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              onClick={() => {
                if (!rejectTarget) return
                rejectMutation.mutate(
                  { id: rejectTarget.id, reason: rejectReason.trim() },
                  { onSuccess: () => setRejectTarget(null) }
                )
              }}
            >
              {rejectMutation.isPending ? 'Rejecting…' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
