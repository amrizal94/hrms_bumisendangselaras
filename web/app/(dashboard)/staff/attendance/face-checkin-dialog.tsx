'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, XCircle, ScanFace } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FaceCamera } from '@/components/face/face-camera'
import { useFaceAttendance } from '@/hooks/use-face-data'

interface Props {
  open: boolean
  action: 'check_in' | 'check_out'
  onOpenChange: (open: boolean) => void
}

type ResultState = { success: boolean; message: string; errorCode?: string } | null

export function FaceCheckinDialog({ open, action, onOpenChange }: Props) {
  const faceAttendanceMutation = useFaceAttendance()
  const [result, setResult] = useState<ResultState>(null)

  async function handleCapture(detection: { descriptor: number[] }) {
    const res = await faceAttendanceMutation.mutateAsync({
      descriptor: detection.descriptor,
      action,
    }).catch((err: { response?: { data?: { message?: string; error_code?: string } } }) => ({
      success: false,
      message: err?.response?.data?.message ?? 'Wajah tidak dikenali. Coba lagi.',
      errorCode: err?.response?.data?.error_code,
    }))
    setResult({
      success: res.success,
      message: res.message,
      errorCode: (res as { errorCode?: string }).errorCode,
    })
    if (res.success) {
      setTimeout(() => {
        setResult(null)
        onOpenChange(false)
      }, 2000)
    }
  }

  function handleClose(open: boolean) {
    if (!open) setResult(null)
    onOpenChange(open)
  }

  const title = action === 'check_in' ? 'Face Check-In' : 'Face Check-Out'
  const notEnrolled = result?.errorCode === 'face_not_enrolled'

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">Posisikan wajahmu di kamera, sistem akan menangkap otomatis.</p>
        </DialogHeader>

        {result ? (
          <div className={`flex flex-col items-center gap-3 py-6 ${result.success ? 'text-green-600' : 'text-red-500'}`}>
            {result.success ? <CheckCircle2 className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
            <p className="font-medium text-center">{result.message}</p>
            {notEnrolled && (
              <Button asChild size="sm" className="mt-1 gap-2" onClick={() => onOpenChange(false)}>
                <Link href="/staff/face-enroll">
                  <ScanFace className="w-4 h-4" />
                  Daftarkan Wajah Sekarang
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <FaceCamera
            onCapture={handleCapture}
            captureLabel={title}
            disabled={faceAttendanceMutation.isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
