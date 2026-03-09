'use client'

import { useState } from 'react'
import { Eye, ChevronLeft, ChevronRight, Banknote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useMyPayslips } from '@/hooks/use-payroll'
import { PayslipDetailDialog } from '@/components/payroll/payslip-detail-dialog'
import type { PayrollFilters, PayrollRecord } from '@/types/payroll'

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  finalized: { label: 'Finalized', className: 'bg-blue-100 text-blue-700' },
  paid:      { label: 'Paid',      className: 'bg-emerald-100 text-emerald-700' },
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const IDR = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v)

export default function StaffPayslipPage() {
  const [filters, setFilters]       = useState<PayrollFilters>({ page: 1, per_page: 12 })
  const [viewRecord, setViewRecord] = useState<PayrollRecord | null>(null)

  const { data, isLoading } = useMyPayslips(filters)
  const payslips = data?.data ?? []
  const meta     = data?.meta

  // Latest payslip for summary
  const latest = payslips[0]

  return (
    <DashboardLayout title="My Payslip">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Payslip</h1>
          <p className="text-muted-foreground text-sm mt-0.5">View your salary history</p>
        </div>

        {/* Latest Payslip Summary */}
        {latest && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Banknote className="w-4 h-4" />
                Latest Payslip — {latest.period_label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Gross Salary</p>
                  <p className="text-lg font-bold">{IDR(latest.gross_salary)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Deductions</p>
                  <p className="text-lg font-bold text-red-600">{IDR(latest.total_deductions)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Net Salary</p>
                  <p className="text-xl font-bold text-primary">{IDR(latest.net_salary)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Attendance</p>
                  <p className="text-lg font-bold">{latest.present_days}/{latest.working_days} days</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setViewRecord(latest)}>
                <Eye className="w-3.5 h-3.5 mr-2" /> View Payslip
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payslip History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payslip History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Salary</TableHead>
                  <TableHead className="text-center">Attendance</TableHead>
                  <TableHead>Status</TableHead>
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
                ) : payslips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      No payslips available yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  payslips.map((rec) => (
                    <TableRow key={rec.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-sm">{rec.period_label}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{IDR(rec.gross_salary)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-red-600">{IDR(rec.total_deductions)}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-bold">{IDR(rec.net_salary)}</TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {rec.present_days}/{rec.working_days}d
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[rec.status]?.className}`}>
                          {STATUS_STYLES[rec.status]?.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => setViewRecord(rec)}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
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

      <PayslipDetailDialog record={viewRecord} onOpenChange={(open) => !open && setViewRecord(null)} />
    </DashboardLayout>
  )
}
