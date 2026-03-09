'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCreateShift, useUpdateShift } from '@/hooks/use-shifts'
import type { Shift } from '@/types/shift'

const DAY_LABELS: Record<number, string> = {
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
  7: 'Minggu',
}

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  check_in_time: z.string().min(1, 'Check-in time is required'),
  check_out_time: z.string().min(1, 'Check-out time is required'),
  late_tolerance_minutes: z.string().min(1, 'Required'),
  work_days: z.array(z.number()).min(1, 'Select at least one work day'),
  is_active: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  shift?: Shift | null
}

export function ShiftFormDialog({ open, onOpenChange, shift }: Props) {
  const isEdit = !!shift
  const createMutation = useCreateShift()
  const updateMutation = useUpdateShift()
  const isPending = createMutation.isPending || updateMutation.isPending

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      late_tolerance_minutes: '15',
      work_days: [1, 2, 3, 4, 5],
      is_active: true,
    },
  })

  const workDays = watch('work_days') ?? []

  useEffect(() => {
    if (open) {
      if (shift) {
        reset({
          name: shift.name,
          check_in_time: shift.check_in_time,
          check_out_time: shift.check_out_time,
          late_tolerance_minutes: shift.late_tolerance_minutes.toString(),
          work_days: shift.work_days,
          is_active: shift.is_active,
        })
      } else {
        reset({
          name: '',
          check_in_time: '08:00',
          check_out_time: '17:00',
          late_tolerance_minutes: '15',
          work_days: [1, 2, 3, 4, 5],
          is_active: true,
        })
      }
    }
  }, [open, shift, reset])

  function toggleDay(day: number) {
    const current = workDays
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort((a, b) => a - b)
    setValue('work_days', next, { shouldValidate: true })
  }

  function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      check_in_time: values.check_in_time,
      check_out_time: values.check_out_time,
      late_tolerance_minutes: parseInt(values.late_tolerance_minutes),
      work_days: values.work_days,
      is_active: values.is_active ?? true,
    }

    if (isEdit && shift) {
      updateMutation.mutate(
        { id: shift.id, data: payload },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      createMutation.mutate(payload, { onSuccess: () => onOpenChange(false) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Shift' : 'Create Shift'}</DialogTitle>
        </DialogHeader>

        <form id="shift-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="name">Shift Name <span className="text-destructive">*</span></Label>
            <Input id="name" {...register('name')} placeholder="e.g. Shift Pagi" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="check_in_time">Check-in Time <span className="text-destructive">*</span></Label>
              <Input id="check_in_time" type="time" {...register('check_in_time')} />
              {errors.check_in_time && <p className="text-xs text-destructive">{errors.check_in_time.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="check_out_time">Check-out Time <span className="text-destructive">*</span></Label>
              <Input id="check_out_time" type="time" {...register('check_out_time')} />
              {errors.check_out_time && <p className="text-xs text-destructive">{errors.check_out_time.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="late_tolerance_minutes">Late Tolerance (minutes)</Label>
            <Input
              id="late_tolerance_minutes"
              type="number"
              min="0"
              max="120"
              {...register('late_tolerance_minutes')}
            />
            {errors.late_tolerance_minutes && (
              <p className="text-xs text-destructive">{errors.late_tolerance_minutes.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Work Days <span className="text-destructive">*</span></Label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                    workDays.includes(day)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'
                  }`}
                >
                  {DAY_LABELS[day]}
                </button>
              ))}
            </div>
            {errors.work_days && <p className="text-xs text-destructive">{errors.work_days.message}</p>}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_active"
              type="checkbox"
              {...register('is_active')}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
        </form>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" form="shift-form" disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Shift'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
