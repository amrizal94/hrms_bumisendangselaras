'use client'

import { useState } from 'react'
import { Check, X, Loader2, CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useLeaves, useApproveLeave, useRejectLeave } from '@/hooks/use-leave'

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

interface RejectState { id: number; name: string }

export function PendingLeavePanel({ limit = 6 }: { limit?: number }) {
  const { data, isLoading } = useLeaves({ status: 'pending', per_page: limit })
  const approveMutation = useApproveLeave()
  const rejectMutation  = useRejectLeave()

  const [rejectTarget, setRejectTarget] = useState<RejectState | null>(null)
  const [reason, setReason] = useState('')

  const requests = data?.data ?? []
  const total    = data?.meta?.total ?? 0

  function handleApprove(id: number) {
    approveMutation.mutate(id)
  }

  function openReject(id: number, name: string) {
    setRejectTarget({ id, name })
    setReason('')
  }

  function handleReject() {
    if (!rejectTarget || !reason.trim()) return
    rejectMutation.mutate(
      { id: rejectTarget.id, reason: reason.trim() },
      { onSuccess: () => { setRejectTarget(null); setReason('') } }
    )
  }

  return (
    <>
      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Pending Leave Requests</h3>
            {total > 0 && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200">{total}</Badge>
            )}
          </div>
          <Link href="/admin/leave" className="text-xs text-primary hover:underline">
            View all
          </Link>
        </div>

        <div className="divide-y">
          {isLoading && (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
          )}
          {!isLoading && requests.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No pending leave requests.
            </div>
          )}
          {requests.map((req) => (
            <div key={req.id} className="flex items-center justify-between px-5 py-3 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                  {req.employee?.user.name.charAt(0) ?? '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{req.employee?.user.name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {req.leave_type?.name} · {fmtDate(req.start_date)}
                    {req.total_days > 1 ? ` + ${req.total_days - 1}d` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                  disabled={approveMutation.isPending}
                  onClick={() => handleApprove(req.id)}
                  title="Approve"
                >
                  {approveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                  disabled={rejectMutation.isPending}
                  onClick={() => openReject(req.id, req.employee?.user.name ?? '?')}
                  title="Reject"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reject reason dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={open => !open && setRejectTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <p className="text-sm text-muted-foreground">{rejectTarget?.name}</p>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Rejection Reason</Label>
              <Textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Enter reason..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectTarget(null)} disabled={rejectMutation.isPending}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!reason.trim() || rejectMutation.isPending}
              >
                {rejectMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
