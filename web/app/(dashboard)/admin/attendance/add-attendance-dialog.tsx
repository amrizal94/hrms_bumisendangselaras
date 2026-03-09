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
import { useCreateAttendance } from '@/hooks/use-attendance'
import { useEmployees } from '@/hooks/use-employees'

const schema = z.object({
  employee_id: z.string().min(1, 'Employee is required'),
  check_in:    z.string().min(1, 'Check-in time is required'),
  check_out:   z.string().optional(),
  status:      z.enum(['present', 'late', 'absent', 'half_day', 'on_leave']),
  notes:       z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function localToApi(local: string): string {
  return local.replace('T', ' ') + ':00'
}

interface Props {
  open: boolean
  defaultDate?: string
  onOpenChange: (open: boolean) => void
}

export function AddAttendanceDialog({ open, defaultDate, onOpenChange }: Props) {
  const createMutation = useCreateAttendance()
  const { data: empData } = useEmployees({ per_page: 200, status: 'active' })
  const employees = empData?.data ?? []

  const defaultCheckIn = defaultDate ? `${defaultDate}T08:00` : ''

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'present', check_in: defaultCheckIn },
  })

  // Sync default check_in when defaultDate changes
  useEffect(() => {
    if (defaultDate) {
      setValue('check_in', `${defaultDate}T08:00`)
    }
  }, [defaultDate, setValue])

  function onSubmit(values: FormValues) {
    const checkIn = localToApi(values.check_in)
    const date    = values.check_in.slice(0, 10)

    createMutation.mutate(
      {
        employee_id: parseInt(values.employee_id),
        date,
        check_in:  checkIn,
        check_out: values.check_out ? localToApi(values.check_out) : undefined,
        status:    values.status,
        notes:     values.notes || undefined,
      },
      {
        onSuccess: () => {
          reset({ status: 'present', check_in: defaultCheckIn })
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Manual Attendance Entry</DialogTitle>
        </DialogHeader>

        <form id="add-attendance-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Employee</Label>
            <Select onValueChange={(v) => setValue('employee_id', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id.toString()}>
                    {emp.user.name} — {emp.employee_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.employee_id && (
              <p className="text-xs text-destructive">{errors.employee_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="add-check-in">Check In</Label>
              <Input id="add-check-in" type="datetime-local" {...register('check_in')} />
              {errors.check_in && (
                <p className="text-xs text-destructive">{errors.check_in.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-check-out">Check Out</Label>
              <Input id="add-check-out" type="datetime-local" {...register('check_out')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={watch('status')}
              onValueChange={(v) => setValue('status', v as FormValues['status'])}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="half_day">Half Day</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="add-notes">Notes</Label>
            <Textarea
              id="add-notes"
              {...register('notes')}
              rows={2}
              placeholder="Reason for manual entry..."
            />
          </div>
        </form>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form="add-attendance-form" disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Add Entry
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
