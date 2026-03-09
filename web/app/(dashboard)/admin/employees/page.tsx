'use client'

import { useState } from 'react'
import { Plus, Search, ChevronLeft, ChevronRight, Pencil, Trash2, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { useDepartments, useEmployees, useToggleEmployeeActive } from '@/hooks/use-employees'
import { EmployeeFormDialog } from './employee-form-dialog'
import { DeleteEmployeeDialog } from './delete-employee-dialog'
import type { Employee, EmployeeFilters } from '@/types/employee'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-100 text-slate-600',
  terminated: 'bg-red-100 text-red-700',
  on_leave: 'bg-amber-100 text-amber-700',
}

const TYPE_LABELS: Record<string, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  intern: 'Intern',
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(value)
  )
}

export default function EmployeesPage() {
  const [filters, setFilters] = useState<EmployeeFilters>({ page: 1, per_page: 10 })
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null)

  const { data, isLoading } = useEmployees(filters)
  const { data: deptData } = useDepartments()
  const toggleActive = useToggleEmployeeActive()

  const employees = data?.data ?? []
  const meta = data?.meta
  const departments = deptData?.data ?? []

  function applySearch() {
    setFilters((f) => ({ ...f, search: search || undefined, page: 1 }))
  }

  function handleDeptFilter(val: string) {
    setFilters((f) => ({ ...f, department_id: val === 'all' ? undefined : val, page: 1 }))
  }

  function handleStatusFilter(val: string) {
    setFilters((f) => ({ ...f, status: val === 'all' ? undefined : val, page: 1 }))
  }

  function handleTypeFilter(val: string) {
    setFilters((f) => ({ ...f, employment_type: val === 'all' ? undefined : val, page: 1 }))
  }

  function openAdd() {
    setEditEmployee(null)
    setFormOpen(true)
  }

  function openEdit(emp: Employee) {
    setEditEmployee(emp)
    setFormOpen(true)
  }

  return (
    <DashboardLayout title="Employees" allowedRoles={['admin', 'hr', 'manager', 'director']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {meta ? `${meta.total} total employees` : 'Manage your workforce'}
            </p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-2 flex-1 min-w-60">
            <Input
              placeholder="Search by name, email, or employee number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
              className="flex-1"
            />
            <Button variant="outline" size="icon" onClick={applySearch}>
              <Search className="w-4 h-4" />
            </Button>
          </div>

          <Select onValueChange={handleDeptFilter} defaultValue="all">
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={handleStatusFilter} defaultValue="all">
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={handleTypeFilter} defaultValue="all">
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="full_time">Full Time</SelectItem>
              <SelectItem value="part_time">Part Time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="intern">Intern</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-28">Emp #</TableHead>
                <TableHead>Name / Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Login</TableHead>
                <TableHead className="w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 11 }).map((__, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-muted animate-pulse rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-12 text-muted-foreground">
                    No employees found.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => (
                  <TableRow key={emp.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-sm font-medium">
                      {emp.employee_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{emp.user.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {emp.department ? (
                        <span>{emp.department.name}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {emp.shift ? (
                        <span>{emp.shift.name}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{emp.position}</TableCell>
                    <TableCell>
                      <span className="text-xs">{TYPE_LABELS[emp.employment_type]}</span>
                    </TableCell>
                    <TableCell className="text-sm font-mono text-xs">
                      {formatCurrency(emp.basic_salary)}
                    </TableCell>
                    <TableCell className="text-sm">{emp.join_date}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[emp.status]}`}
                      >
                        {emp.status.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          emp.user.is_active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {emp.user.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${emp.user.is_active ? 'text-emerald-600 hover:text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}
                          title={emp.user.is_active ? 'Nonaktifkan akun' : 'Aktifkan akun'}
                          disabled={toggleActive.isPending}
                          onClick={() => toggleActive.mutate(emp.id)}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(emp)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteEmployee(emp)}
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
              <span className="px-2">
                {meta.current_page} / {meta.last_page}
              </span>
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

      {/* Dialogs */}
      <EmployeeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        employee={editEmployee}
      />
      <DeleteEmployeeDialog
        employee={deleteEmployee}
        onOpenChange={(open) => !open && setDeleteEmployee(null)}
      />
    </DashboardLayout>
  )
}
