'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, CalendarRange } from 'lucide-react'
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
import { useApplyLeave, useLeaveTypes } from '@/hooks/use-leave'

const schema = z.object({
  leave_type_id: z.string().min(1, 'Select a leave type'),
  start_date:    z.string().min(1, 'Start date is required'),
  end_date:      z.string().min(1, 'End date is required'),
  reason:        z.string().min(10, 'Reason must be at least 10 characters'),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ApplyLeaveDialog({ open, onOpenChange }: Props) {
  const { data: leaveTypes = [] } = useLeaveTypes()
  const applyMutation = useApplyLeave()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const startDate = watch('start_date')
  const endDate   = watch('end_date')

  const totalDays = startDate && endDate
    ? Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1)
    : 0

  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  function onSubmit(values: FormValues) {
    applyMutation.mutate(
      {
        leave_type_id: parseInt(values.leave_type_id),
        start_date:    values.start_date,
        end_date:      values.end_date,
        reason:        values.reason,
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
            <CalendarRange className="w-5 h-5" /> Apply for Leave
          </DialogTitle>
        </DialogHeader>

        <form id="apply-leave-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Leave Type <span className="text-destructive">*</span></Label>
            <Select onValueChange={(v) => setValue('leave_type_id', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.name}
                    <span className="ml-1 text-muted-foreground text-xs">
                      (max {t.max_days_per_year}d/yr{!t.is_paid ? ' · unpaid' : ''})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.leave_type_id && <p className="text-xs text-destructive">{errors.leave_type_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="start_date">Start Date <span className="text-destructive">*</span></Label>
              <Input id="start_date" type="date" min={today} {...register('start_date')} />
              {errors.start_date && <p className="text-xs text-destructive">{errors.start_date.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end_date">End Date <span className="text-destructive">*</span></Label>
              <Input id="end_date" type="date" min={startDate || today} {...register('end_date')} />
              {errors.end_date && <p className="text-xs text-destructive">{errors.end_date.message}</p>}
            </div>
          </div>

          {totalDays > 0 && (
            <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
              Duration: <span className="font-semibold text-foreground">{totalDays} day{totalDays > 1 ? 's' : ''}</span>
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason <span className="text-destructive">*</span></Label>
            <Textarea id="reason" {...register('reason')} rows={3} placeholder="Please provide a reason for your leave request..." />
            {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
          </div>
        </form>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={applyMutation.isPending}>Cancel</Button>
          <Button type="submit" form="apply-leave-form" disabled={applyMutation.isPending}>
            {applyMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
