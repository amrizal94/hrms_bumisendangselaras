'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSubmitOvertime } from '@/hooks/use-overtime'
import { useHolidayDates } from '@/hooks/use-holidays'

const schema = z.object({
  date:           z.string().min(1, 'Date is required'),
  overtime_hours: z.string().min(1, 'Hours is required'),
  overtime_type:  z.string().min(1, 'Select overtime type'),
  reason:         z.string().min(5, 'Reason must be at least 5 characters'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SubmitOvertimeDialog({ open, onOpenChange }: Props) {
  const submitMutation = useSubmitOvertime()
  const { data: holidayDates = [] } = useHolidayDates(new Date().getFullYear())

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const selectedDate = watch('date')

  // Auto-detect overtime type based on selected date
  useEffect(() => {
    if (!selectedDate) return
    if (holidayDates.includes(selectedDate)) {
      setValue('overtime_type', 'holiday')
    } else {
      const day = new Date(selectedDate + 'T00:00:00').getDay()
      setValue('overtime_type', day === 0 || day === 6 ? 'weekend' : 'regular')
    }
  }, [selectedDate, holidayDates, setValue])

  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  function onSubmit(values: FormValues) {
    submitMutation.mutate(
      {
        date:           values.date,
        overtime_hours: parseFloat(values.overtime_hours),
        overtime_type:  values.overtime_type as 'regular' | 'weekend' | 'holiday',
        reason:         values.reason,
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5" /> Submit Overtime Request
          </DialogTitle>
        </DialogHeader>

        <form id="submit-overtime-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="date">Date <span className="text-destructive">*</span></Label>
            <Input id="date" type="date" max={today} {...register('date')} />
            {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="overtime_hours">
                Hours <span className="text-destructive">*</span>
              </Label>
              <Input
                id="overtime_hours"
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                placeholder="e.g. 2.5"
                {...register('overtime_hours')}
              />
              {errors.overtime_hours && (
                <p className="text-xs text-destructive">{errors.overtime_hours.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Type <span className="text-destructive">*</span></Label>
              <Select value={watch('overtime_type') ?? ''} onValueChange={(v) => setValue('overtime_type', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="weekend">Weekend</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                </SelectContent>
              </Select>
              {errors.overtime_type && (
                <p className="text-xs text-destructive">{errors.overtime_type.message}</p>
              )}
              {selectedDate && (
                <p className="text-xs text-muted-foreground">
                  {holidayDates.includes(selectedDate)
                    ? '🎌 Public holiday detected'
                    : (() => { const d = new Date(selectedDate + 'T00:00:00').getDay(); return d === 0 || d === 6 ? '📅 Weekend detected' : null })()}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason <span className="text-destructive">*</span></Label>
            <Textarea
              id="reason"
              {...register('reason')}
              rows={3}
              placeholder="Describe the work done during overtime..."
            />
            {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
          </div>
        </form>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="submit-overtime-form" disabled={submitMutation.isPending}>
            {submitMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
