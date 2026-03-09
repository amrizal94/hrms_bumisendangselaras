'use client'

import { useState } from 'react'
import { Plus, Search, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
} from '@/components/ui/dialog'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useShifts, useDeleteShift } from '@/hooks/use-shifts'
import { ShiftFormDialog } from './shift-form-dialog'
import type { Shift, ShiftFilters } from '@/types/shift'

const DAY_LABELS: Record<number, string> = {
  1: 'Sen',
  2: 'Sel',
  3: 'Rab',
  4: 'Kam',
  5: 'Jum',
  6: 'Sab',
  7: 'Min',
}

export default function ShiftsPage() {
  const [filters, setFilters] = useState<ShiftFilters>({ page: 1, per_page: 15 })
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editShift, setEditShift] = useState<Shift | null>(null)
  const [deleteShift, setDeleteShift] = useState<Shift | null>(null)

  const { data, isLoading } = useShifts(filters)
  const deleteMutation = useDeleteShift()

  const shifts = data?.data ?? []
  const meta = data?.meta

  function applySearch() {
    setFilters((f) => ({ ...f, search: search || undefined, page: 1 }))
  }

  function openAdd() {
    setEditShift(null)
    setFormOpen(true)
  }

  function openEdit(s: Shift) {
    setEditShift(s)
    setFormOpen(true)
  }

  function confirmDelete() {
    if (!deleteShift) return
    deleteMutation.mutate(deleteShift.id, { onSuccess: () => setDeleteShift(null) })
  }

  return (
    <DashboardLayout title="Shifts" allowedRoles={['admin', 'hr', 'director']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Shifts</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {meta ? `${meta.total} shifts` : 'Manage work shifts'}
            </p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Shift
          </Button>
        </div>

        {/* Search */}
        <div className="flex gap-2 max-w-sm">
          <Input
            placeholder="Search shifts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
          />
          <Button variant="outline" size="icon" onClick={applySearch}>
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Name</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Tolerance</TableHead>
                <TableHead>Work Days</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-muted animate-pulse rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : shifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No shifts found.
                  </TableCell>
                </TableRow>
              ) : (
                shifts.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="font-mono text-sm">{s.check_in_time}</TableCell>
                    <TableCell className="font-mono text-sm">{s.check_out_time}</TableCell>
                    <TableCell className="text-sm">{s.late_tolerance_minutes} min</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {s.work_days.map((d) => (
                          <span
                            key={d}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700"
                          >
                            {DAY_LABELS[d]}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{s.employee_count ?? 0}</TableCell>
                    <TableCell>
                      <Badge
                        variant={s.is_active ? 'default' : 'secondary'}
                        className={s.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}
                      >
                        {s.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(s)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteShift(s)}
                        >
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
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={meta.current_page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-2">{meta.current_page} / {meta.last_page}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={meta.current_page >= meta.last_page}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <ShiftFormDialog open={formOpen} onOpenChange={setFormOpen} shift={editShift} />

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteShift} onOpenChange={(o) => !o && setDeleteShift(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Shift</DialogTitle>
          </DialogHeader>
          {deleteShift && (deleteShift.employee_count ?? 0) > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Cannot delete <strong>{deleteShift.name}</strong> because it has{' '}
                <strong>{deleteShift.employee_count}</strong> assigned employee(s). Please reassign
                them to another shift first.
              </p>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setDeleteShift(null)}>Close</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete <strong>{deleteShift?.name}</strong>? This action
                cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleteShift(null)}>Cancel</Button>
                <Button
                  variant="destructive"
                  disabled={deleteMutation.isPending}
                  onClick={confirmDelete}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
