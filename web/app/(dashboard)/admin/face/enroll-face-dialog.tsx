'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FaceCamera } from '@/components/face/face-camera'
import { useEnrollFace } from '@/hooks/use-face-data'
import type { FaceEnrollmentStatus } from '@/types/face'

interface Props {
  employee: FaceEnrollmentStatus | null
  onOpenChange: (open: boolean) => void
}

export function EnrollFaceDialog({ employee, onOpenChange }: Props) {
  const enrollMutation = useEnrollFace()
  const [captured, setCaptured] = useState<{ descriptor: number[]; snapshot: string } | null>(null)
  const [done, setDone] = useState(false)

  function handleCapture(detection: { descriptor: number[] }, snapshot: string) {
    setCaptured({ descriptor: detection.descriptor, snapshot })
  }

  function handleEnroll() {
    if (!employee || !captured) return
    enrollMutation.mutate(
      {
        employee_id: employee.employee_id,
        descriptor: captured.descriptor,
        snapshot: captured.snapshot,
      },
      {
        onSuccess: () => {
          setDone(true)
          setTimeout(() => {
            setDone(false)
            setCaptured(null)
            onOpenChange(false)
          }, 1500)
        },
      }
    )
  }

  function handleClose(open: boolean) {
    if (!open) {
      setCaptured(null)
      setDone(false)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={!!employee} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Enroll Face</DialogTitle>
          {employee && (
            <p className="text-sm text-muted-foreground">
              {employee.user.name} — {employee.employee_number}
            </p>
          )}
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-6 text-green-600">
            <CheckCircle2 className="w-12 h-12" />
            <p className="font-medium">Face enrolled successfully!</p>
          </div>
        ) : captured ? (
          <div className="flex flex-col items-center gap-4">
            {/* Preview snapshot */}
            <div className="relative rounded-xl overflow-hidden border w-[320px] h-[240px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={captured.snapshot} alt="Captured face" className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
            </div>
            <p className="text-sm text-muted-foreground">Descriptor captured. Ready to enroll.</p>
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1" onClick={() => setCaptured(null)} disabled={enrollMutation.isPending}>
                Retake
              </Button>
              <Button className="flex-1" onClick={handleEnroll} disabled={enrollMutation.isPending}>
                {enrollMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Enrollment
              </Button>
            </div>
          </div>
        ) : (
          <FaceCamera onCapture={handleCapture} captureLabel="Capture Face" />
        )}
      </DialogContent>
    </Dialog>
  )
}
