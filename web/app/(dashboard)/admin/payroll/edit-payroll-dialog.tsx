'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useUpdatePayroll } from '@/hooks/use-payroll'
import type { PayrollRecord } from '@/types/payroll'

const schema = z.object({
  allowances:       z.string(),
  overtime_pay:     z.string(),
  other_deductions: z.string(),
  notes:            z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  record: PayrollRecord | null
  onOpenChange: (open: boolean) => void
}

const IDR = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v)

export function EditPayrollDialog({ record, onOpenChange }: Props) {
  const updateMutation = useUpdatePayroll()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (record) {
      reset({
        allowances:       String(record.allowances),
        overtime_pay:     String(record.overtime_pay),
        other_deductions: String(record.other_deductions),
        notes:            record.notes ?? '',
      })
    }
  }, [record, reset])

  function onSubmit(values: FormValues) {
    if (!record) return
    updateMutation.mutate(
      {
        id: record.id,
        data: {
          allowances:       parseFloat(values.allowances) || 0,
          overtime_pay:     parseFloat(values.overtime_pay) || 0,
          other_deductions: parseFloat(values.other_deductions) || 0,
          notes:            values.notes || null,
        },
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={!!record} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Payroll</DialogTitle>
          {record && (
            <p className="text-sm text-muted-foreground">
              {record.employee?.user.name} — {record.period_label}
              <span className="ml-2 text-xs">Basic: {IDR(record.basic_salary)}</span>
            </p>
          )}
        </DialogHeader>

        <form id="edit-payroll-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="allowances">Allowances (IDR)</Label>
            <Input id="allowances" type="number" min="0" {...register('allowances')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="overtime_pay">Overtime Pay (IDR)</Label>
            <Input id="overtime_pay" type="number" min="0" {...register('overtime_pay')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="other_deductions">Other Deductions (IDR)</Label>
            <Input id="other_deductions" type="number" min="0" {...register('other_deductions')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register('notes')} rows={2} placeholder="Optional..." />
          </div>
        </form>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={updateMutation.isPending}>Cancel</Button>
          <Button type="submit" form="edit-payroll-form" disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
