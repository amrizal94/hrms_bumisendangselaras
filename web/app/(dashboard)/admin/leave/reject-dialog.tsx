'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useRejectLeave } from '@/hooks/use-leave'
import type { LeaveRequest } from '@/types/leave'

const schema = z.object({
  rejection_reason: z.string().min(5, 'Please provide a reason (min 5 characters)'),
})

interface Props {
  request: LeaveRequest | null
  onOpenChange: (open: boolean) => void
}

export function RejectDialog({ request, onOpenChange }: Props) {
  const rejectMutation = useRejectLeave()
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  function onSubmit(values: { rejection_reason: string }) {
    if (!request) return
    rejectMutation.mutate(
      { id: request.id, reason: values.rejection_reason },
      { onSuccess: () => { reset(); onOpenChange(false) } }
    )
  }

  return (
    <Dialog open={!!request} onOpenChange={(open) => { if (!open) { reset(); onOpenChange(false) } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reject Leave Request</DialogTitle>
          {request && (
            <p className="text-sm text-muted-foreground">
              {request.employee?.user.name} — {request.leave_type?.name} ({request.total_days}d)
            </p>
          )}
        </DialogHeader>
        <form id="reject-form" onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="rejection_reason">Reason for Rejection <span className="text-destructive">*</span></Label>
            <Textarea id="rejection_reason" {...register('rejection_reason')} rows={3}
              placeholder="Explain why this request is being rejected..." />
            {errors.rejection_reason && (
              <p className="text-xs text-destructive">{errors.rejection_reason.message}</p>
            )}
          </div>
        </form>
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false) }} disabled={rejectMutation.isPending}>Cancel</Button>
          <Button variant="destructive" type="submit" form="reject-form" disabled={rejectMutation.isPending}>
            {rejectMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Reject
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
