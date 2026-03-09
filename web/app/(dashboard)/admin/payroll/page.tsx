'use client'

import { useState } from 'react'
import {
  Wallet, TrendingDown, Banknote, FileText,
  Zap, CheckCheck, CreditCard, Search,
  ChevronLeft, ChevronRight, Pencil, Eye, Trash2, Download, Printer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { api } from '@/lib/api'
import {
  useDeletePayroll, useFinalizeAll, useFinalizePayroll,
  useGeneratePayroll, useMarkAllPaid, useMarkPayrollPaid, usePayrolls, usePayrollSummary,
} from '@/hooks/use-payroll'
import { useDepartments } from '@/hooks/use-employees'
import { useSettings } from '@/hooks/use-settings'
import { PayslipDetailDialog } from '@/components/payroll/payslip-detail-dialog'
import { EditPayrollDialog } from './edit-payroll-dialog'
import { printPayslip, printPayslips } from '@/lib/payslip-pdf'
import type { PayrollFilters, PayrollRecord } from '@/types/payroll'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  draft:     { label: 'Draft',     className: 'bg-slate-100 text-slate-600' },
  finalized: { label: 'Finalized', className: 'bg-blue-100 text-blue-700' },
  paid:      { label: 'Paid',      className: 'bg-emerald-100 text-emerald-700' },
}

const IDR = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v)

function SummaryCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string; icon: React.ElementType; color: string; sub?: string
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-base font-bold truncate">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

const now = new Date()

function escapeCsv(v: unknown): string {
  const s = String(v ?? '')
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
}

function downloadPayrollCsv(records: PayrollRecord[], year: number, month: number) {
  const headers = [
    'No. Karyawan', 'Nama', 'Departemen', 'Jabatan',
    'Hari Kerja', 'Hadir', 'Cuti', 'Alpha',
    'Gaji Pokok', 'Tunjangan', 'Lembur', 'Gaji Bruto',
    'Potongan Alpha', 'Potongan Lain', 'PPh21', 'BPJS',
    'Total Potongan', 'Gaji Bersih', 'Status', 'Tanggal Bayar', 'Catatan',
  ]
  const rows = records.map((r) => [
    r.employee?.employee_number ?? '',
    r.employee?.user.name ?? '',
    r.employee?.department?.name ?? '',
    r.employee?.position ?? '',
    r.working_days, r.present_days, r.leave_days, r.absent_days,
    r.basic_salary, r.allowances, r.overtime_pay, r.gross_salary,
    r.absent_deduction, r.other_deductions, r.tax_deduction, r.bpjs_deduction,
    r.total_deductions, r.net_salary,
    r.status,
    r.paid_at ? new Date(r.paid_at).toLocaleDateString('id-ID') : '',
    r.notes ?? '',
  ].map(escapeCsv).join(','))

  const csv = [headers.map(escapeCsv).join(','), ...rows].join('\n')
  const blob = new Blob([`\uFEFF${csv}`, /* BOM agar Excel baca UTF-8 */], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `payroll-${year}-${String(month).padStart(2, '0')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminPayrollPage() {
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const [filters, setFilters]       = useState<PayrollFilters>({ year, month, page: 1, per_page: 20 })
  const [search, setSearch]         = useState('')
  const [viewRecord, setViewRecord]     = useState<PayrollRecord | null>(null)
  const [editRecord, setEditRecord]     = useState<PayrollRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PayrollRecord | null>(null)
  const [isExporting, setIsExporting]     = useState(false)
  const [isPrintingAll, setIsPrintingAll] = useState(false)

  const { data, isLoading }    = usePayrolls(filters)
  const { data: summary }      = usePayrollSummary(year, month)
  const { data: deptData }     = useDepartments()
  const { data: settingsData } = useSettings()

  const company = {
    name:    settingsData?.data.company['company.name']    || 'BSS HRMS',
    address: settingsData?.data.company['company.address'] || undefined,
    phone:   settingsData?.data.company['company.phone']   || undefined,
    email:   settingsData?.data.company['company.email']   || undefined,
  }

  const generateMutation  = useGeneratePayroll()
  const finalizeOne       = useFinalizePayroll()
  const markPaidOne       = useMarkPayrollPaid()
  const finalizeAll       = useFinalizeAll()
  const markAllPaid       = useMarkAllPaid()
  const deleteOne         = useDeletePayroll()

  const records     = data?.data ?? []
  const meta        = data?.meta
  const departments = deptData?.data ?? []

  async function handlePrintAll() {
    setIsPrintingAll(true)
    try {
      const res = await api.get('/payroll', { params: { year, month, per_page: 9999 } })
      const all: PayrollRecord[] = res.data?.data ?? []
      if (all.length === 0) { alert('Tidak ada data payroll untuk periode ini.'); return }
      printPayslips(all, company, `${MONTHS[month - 1]} ${year}`)
    } catch {
      alert('Gagal mengambil data. Coba lagi.')
    } finally {
      setIsPrintingAll(false)
    }
  }

  async function handleExportCsv() {
    setIsExporting(true)
    try {
      const res = await api.get('/payroll', { params: { year, month, per_page: 9999 } })
      const all: PayrollRecord[] = res.data?.data ?? []
      if (all.length === 0) { alert('Tidak ada data payroll untuk periode ini.'); return }
      downloadPayrollCsv(all, year, month)
    } catch {
      alert('Gagal mengambil data. Coba lagi.')
    } finally {
      setIsExporting(false)
    }
  }

  function setPeriod(y: number, m: number) {
    setYear(y); setMonth(m)
    setFilters((f) => ({ ...f, year: y, month: m, page: 1 }))
  }

  function applySearch() {
    setFilters((f) => ({ ...f, search: search || undefined, page: 1 }))
  }

  return (
    <DashboardLayout title="Payroll" allowedRoles={['admin', 'hr', 'director']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Payroll</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {MONTHS[month - 1]} {year}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handlePrintAll}
              disabled={isPrintingAll}
            >
              <Printer className="w-4 h-4 mr-2" />
              {isPrintingAll ? 'Menyiapkan…' : 'Print All'}
            </Button>
            <Button
              variant="outline"
              onClick={handleExportCsv}
              disabled={isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting…' : 'Export CSV'}
            </Button>
            <Button
              variant="outline"
              onClick={() => generateMutation.mutate({ year, month })}
              disabled={generateMutation.isPending}
            >
              <Zap className="w-4 h-4 mr-2" />
              Generate Payroll
            </Button>
            <Button
              variant="outline"
              onClick={() => finalizeAll.mutate({ year, month })}
              disabled={finalizeAll.isPending}
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Finalize All
            </Button>
            <Button
              onClick={() => markAllPaid.mutate({ year, month })}
              disabled={markAllPaid.isPending}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Mark All Paid
            </Button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex gap-3">
          <Select value={year.toString()} onValueChange={(v) => setPeriod(parseInt(v), month)}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map((y) => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={month.toString()} onValueChange={(v) => setPeriod(year, parseInt(v))}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard label="Total Gross"   value={IDR(summary.total_gross)}      icon={Wallet}    color="bg-blue-50 text-blue-600" />
            <SummaryCard label="Total Deductions" value={IDR(summary.total_deductions)} icon={TrendingDown} color="bg-red-50 text-red-600" />
            <SummaryCard label="Total Net"     value={IDR(summary.total_net)}        icon={Banknote}  color="bg-emerald-50 text-emerald-600" />
            <SummaryCard
              label="Status"
              value={`${summary.paid_count} Paid`}
              icon={FileText}
              color="bg-amber-50 text-amber-600"
              sub={`${summary.finalized_count} Finalized · ${summary.draft_count} Draft`}
            />
          </div>
        )}

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
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="finalized">Finalized</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
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
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net Salary</TableHead>
                <TableHead className="text-center">Attendance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
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
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No payroll records. Click &quot;Generate Payroll&quot; to create records for this period.
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
                    <TableCell className="text-right text-sm font-mono">{IDR(rec.gross_salary)}</TableCell>
                    <TableCell className="text-right text-sm font-mono text-red-600">{IDR(rec.total_deductions)}</TableCell>
                    <TableCell className="text-right text-sm font-mono font-semibold">{IDR(rec.net_salary)}</TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {rec.present_days}/{rec.working_days}d
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[rec.status]?.className}`}>
                        {STATUS_STYLES[rec.status]?.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => setViewRecord(rec)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          title="Print payslip"
                          onClick={() => printPayslip(rec, company)}>
                          <Printer className="w-3.5 h-3.5" />
                        </Button>
                        {rec.status === 'draft' && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => setEditRecord(rec)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => finalizeOne.mutate(rec.id)}
                              title="Finalize">
                              <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(rec)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                        {rec.status === 'finalized' && (
                          <Button variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => markPaidOne.mutate(rec.id)}
                            title="Mark as Paid">
                            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                          </Button>
                        )}
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

      <PayslipDetailDialog record={viewRecord} onOpenChange={(open) => !open && setViewRecord(null)} />
      <EditPayrollDialog   record={editRecord} onOpenChange={(open) => !open && setEditRecord(null)} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payroll Record</AlertDialogTitle>
            <AlertDialogDescription>
              Delete payroll for{' '}
              <span className="font-semibold text-foreground">{deleteTarget?.employee?.user.name}</span>{' '}
              ({deleteTarget?.period_label})? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteOne.mutate(deleteTarget.id, {
                onSuccess: () => setDeleteTarget(null),
              })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
