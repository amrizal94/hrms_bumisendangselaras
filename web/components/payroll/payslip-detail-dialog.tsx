'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'
import { useSettings } from '@/hooks/use-settings'
import { printPayslip } from '@/lib/payslip-pdf'
import type { PayrollRecord } from '@/types/payroll'

interface Props {
  record: PayrollRecord | null
  onOpenChange: (open: boolean) => void
}

const IDR = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v)

function Row({ label, value, bold, separator }: { label: string; value: string; bold?: boolean; separator?: boolean }) {
  return (
    <>
      {separator && <tr><td colSpan={2}><div className="border-t my-1" /></td></tr>}
      <tr className={bold ? 'font-semibold' : ''}>
        <td className="py-1 pr-4 text-muted-foreground text-sm w-48">{label}</td>
        <td className={`py-1 text-sm text-right ${bold ? 'text-foreground' : ''}`}>{value}</td>
      </tr>
    </>
  )
}

export function PayslipDetailDialog({ record, onOpenChange }: Props) {
  const { data: settingsData } = useSettings()

  if (!record) return null

  const emp = record.employee
  const company = {
    name:    settingsData?.data.company['company.name']    || 'Artech HRM',
    address: settingsData?.data.company['company.address'] || undefined,
    phone:   settingsData?.data.company['company.phone']   || undefined,
    email:   settingsData?.data.company['company.email']   || undefined,
  }

  return (
    <Dialog open={!!record} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Slip Gaji — {record.period_label}</DialogTitle>
          {emp && (
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{emp.user.name}</p>
              <p>{emp.position}{emp.department ? ` · ${emp.department.name}` : ''}</p>
              <p className="font-mono text-xs">{emp.employee_number}</p>
            </div>
          )}
        </DialogHeader>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => printPayslip(record, company)}>
            <Printer className="w-4 h-4 mr-2" />
            Print / PDF
          </Button>
        </div>

        <ScrollArea className="max-h-[65vh]">
          <div className="pr-2">
            {/* Attendance Summary */}
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Kehadiran</h4>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: 'Hari Kerja', value: record.working_days },
                { label: 'Hadir',      value: record.present_days },
                { label: 'Cuti',       value: record.leave_days },
                { label: 'Alpha',      value: record.absent_days },
              ].map((item) => (
                <div key={item.label} className="text-center bg-muted/50 rounded-lg py-2">
                  <p className="text-lg font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Salary Breakdown */}
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Rincian Gaji</h4>
            <table className="w-full">
              <tbody>
                <Row label="Gaji Pokok"      value={IDR(record.basic_salary)} />
                <Row label="Tunjangan"        value={IDR(record.allowances)} />
                <Row label="Lembur"           value={IDR(record.overtime_pay)} />
                <Row label="Gaji Bruto"       value={IDR(record.gross_salary)} bold separator />
                <Row label="Potongan Alpha"   value={`– ${IDR(record.absent_deduction)}`} />
                <Row label="Potongan Lain"    value={`– ${IDR(record.other_deductions)}`} />
                <Row label="PPh21 (Pajak)"    value={`– ${IDR(record.tax_deduction)}`} />
                <Row label="BPJS"             value={`– ${IDR(record.bpjs_deduction)}`} />
                <Row label="Total Potongan"   value={`– ${IDR(record.total_deductions)}`} bold separator />
              </tbody>
            </table>

            {/* Net Salary */}
            <div className="mt-3 rounded-lg bg-primary/5 border border-primary/20 p-4 flex justify-between items-center">
              <span className="text-sm font-semibold">Gaji Bersih</span>
              <span className="text-xl font-bold text-primary">{IDR(record.net_salary)}</span>
            </div>

            {/* Status & Notes */}
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="capitalize font-medium">{record.status}</span>
              </div>
              {record.paid_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dibayar</span>
                  <span>{new Date(record.paid_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              )}
              {record.notes && (
                <div className="pt-1">
                  <span className="text-muted-foreground">Catatan: </span>
                  <span>{record.notes}</span>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
