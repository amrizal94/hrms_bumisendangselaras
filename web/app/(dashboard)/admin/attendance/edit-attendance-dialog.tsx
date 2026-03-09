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
import { useUpdateAttendance } from '@/hooks/use-attendance'
import type { AttendanceRecord } from '@/types/attendance'

const schema = z.object({
  check_in:  z.string().optional(),
  check_out: z.string().optional(),
  status: z.enum(['present', 'late', 'absent', 'half_day', 'on_leave']),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

// Convert ISO string "2026-02-18T12:00:00.000Z" → "2026-02-18T12:00" (local datetime-local input)
function isoToLocal(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(' ', 'T')
}

// Convert "2026-02-18T12:00" → "2026-02-18 12:00:00" for API
function localToDbFormat(local: string): string {
  return local.replace('T', ' ') + ':00'
}

interface Props {
  record: AttendanceRecord | null
  onOpenChange: (open: boolean) => void
}

export function EditAttendanceDialog({ record, onOpenChange }: Props) {
  const updateMutation = useUpdateAttendance()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (record) {
      reset({
        check_in:  isoToLocal(record.check_in),
        check_out: isoToLocal(record.check_out),
        status:    record.status,
        notes:     record.notes ?? '',
      })
    }
  }, [record, reset])

  function onSubmit(values: FormValues) {
    if (!record) return
    updateMutation.mutate(
      {
        id: record.id,
        data: {
          check_in:  values.check_in  ? localToDbFormat(values.check_in)  : undefined,
          check_out: values.check_out ? localToDbFormat(values.check_out) : undefined,
          status:    values.status,
          notes:     values.notes || undefined,
        },
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={!!record} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Attendance Record</DialogTitle>
          {record && (
            <p className="text-sm text-muted-foreground">
              {record.employee?.user.name} — {record.date}
            </p>
          )}
        </DialogHeader>

        <form id="edit-attendance-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="check_in">Check In</Label>
              <Input id="check_in" type="datetime-local" {...register('check_in')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="check_out">Check Out</Label>
              <Input id="check_out" type="datetime-local" {...register('check_out')} />
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
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register('notes')} rows={2} placeholder="Optional notes..." />
          </div>
        </form>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={updateMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="edit-attendance-form" disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
