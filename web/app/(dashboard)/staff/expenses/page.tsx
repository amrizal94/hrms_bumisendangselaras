'use client'

import { useState } from 'react'
import { Plus, Trash2, Receipt, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { useDeleteExpense, useMyExpenses } from '@/hooks/use-expenses'
import { SubmitExpenseDialog } from './submit-expense-dialog'
import type { Expense, ExpenseFilters } from '@/types/expense'

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

export default function StaffExpensesPage() {
  const [filters, setFilters]       = useState<ExpenseFilters>({ page: 1, per_page: 10 })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)

  const { data, isLoading } = useMyExpenses(filters)
  const deleteMutation = useDeleteExpense()

  const expenses = data?.data ?? []
  const meta     = data?.meta

  return (
    <DashboardLayout title="My Expenses" allowedRoles={['staff']}>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Select
            value={(filters.status as string) ?? 'all'}
            onValueChange={(v) => setFilters((f) => ({ ...f, status: v === 'all' ? undefined : v, page: 1 }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Submit Expense
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && expenses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No expenses found.
                    </TableCell>
                  </TableRow>
                )}
                {expenses.map((exp) => {
                  const st = STATUS_STYLES[exp.status] ?? STATUS_STYLES.pending
                  return (
                    <TableRow key={exp.id}>
                      <TableCell className="whitespace-nowrap">{fmtDate(exp.expense_date)}</TableCell>
                      <TableCell className="capitalize">{exp.category}</TableCell>
                      <TableCell className="max-w-xs truncate">{exp.description}</TableCell>
                      <TableCell className="text-right font-medium">{fmtCurrency(exp.amount)}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.className}`}>
                          {st.label}
                        </span>
                        {exp.status === 'rejected' && exp.rejection_reason && (
                          <p className="text-xs text-red-500 mt-0.5 max-w-[160px] truncate" title={exp.rejection_reason}>
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
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-red-600 hover:text-red-700"
                            onClick={() => setDeleteTarget(exp)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
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
      </div>

      <SubmitExpenseDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This expense of {deleteTarget ? fmtCurrency(deleteTarget.amount) : ''} will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteTarget) {
                  deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })
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
