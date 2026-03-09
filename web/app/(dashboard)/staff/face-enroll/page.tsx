'use client'

import { useState } from 'react'
import { CheckCircle2, Clock, Loader2, RefreshCw, ScanFace, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { FaceCamera } from '@/components/face/face-camera'
import { useMyFaceStatus, useSelfEnrollFace } from '@/hooks/use-face-data'

const COOLDOWN_DAYS = 30

// Returns how many days remain in cooldown (0 = can re-enroll)
function cooldownDaysLeft(enrolledAt: string | null): number {
  if (!enrolledAt) return 0
  const daysSince = Math.floor((Date.now() - new Date(enrolledAt).getTime()) / 86_400_000)
  return Math.max(0, COOLDOWN_DAYS - daysSince)
}

// ── Status banner ─────────────────────────────────────────────────────────────

function StatusBanner({ enrolled, enrolledAt }: { enrolled: boolean; enrolledAt: string | null }) {
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

  const daysLeft = cooldownDaysLeft(enrolledAt)

  if (enrolled) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-green-600 shrink-0" />
        <div>
          <p className="font-semibold text-green-800 text-sm">Wajah sudah terdaftar</p>
          {enrolledAt && (
            <p className="text-xs text-green-700 mt-0.5">Didaftarkan pada {fmtDate(enrolledAt)}</p>
          )}
          {daysLeft > 0 ? (
            <p className="text-xs text-amber-700 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Dapat didaftarkan ulang dalam {daysLeft} hari lagi
            </p>
          ) : (
            <p className="text-xs text-green-700 mt-0.5">Kamu dapat mendaftarkan ulang di bawah ini.</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
      <ScanFace className="w-6 h-6 text-amber-600 shrink-0" />
      <div>
        <p className="font-semibold text-amber-800 text-sm">Wajah belum terdaftar</p>
        <p className="text-xs text-amber-700 mt-0.5">
          Daftarkan wajahmu agar bisa melakukan absensi face recognition.
        </p>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FaceEnrollPage() {
  const { data: statusData, isLoading: statusLoading } = useMyFaceStatus()
  const enrollMutation = useSelfEnrollFace()

  const [captured, setCaptured] = useState<{ descriptor: number[]; snapshot: string } | null>(null)
  const [done, setDone] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const status = statusData?.data
  const daysLeft = cooldownDaysLeft(status?.enrolled_at ?? null)
  const inCooldown = status?.enrolled && daysLeft > 0

  function handleCapture(detection: { descriptor: number[] }, snapshot: string) {
    setCaptured({ descriptor: detection.descriptor, snapshot })
    setErrorMsg(null)
  }

  function handleEnroll() {
    if (!captured) return
    setErrorMsg(null)
    enrollMutation.mutate(
      { descriptor: captured.descriptor, snapshot: captured.snapshot },
      {
        onSuccess: () => {
          setDone(true)
          setCaptured(null)
          setTimeout(() => setDone(false), 3000)
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Pendaftaran gagal. Coba lagi.'
          setErrorMsg(msg)
        },
      }
    )
  }

  function handleRetake() {
    setCaptured(null)
    setErrorMsg(null)
  }

  return (
    <DashboardLayout title="Daftarkan Wajah" allowedRoles={['staff', 'hr', 'admin']}>
      <div className="max-w-md mx-auto space-y-6">

        {/* Status */}
        {statusLoading ? (
          <div className="rounded-xl border bg-muted/50 h-16 animate-pulse" />
        ) : status ? (
          <StatusBanner enrolled={status.enrolled} enrolledAt={status.enrolled_at} />
        ) : null}

        {/* Success state */}
        {done && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 flex flex-col items-center gap-3 text-green-700">
            <CheckCircle2 className="w-12 h-12" />
            <p className="font-semibold text-base">Wajah berhasil didaftarkan!</p>
            <p className="text-sm text-green-600">Kamu sekarang bisa menggunakan face recognition untuk absensi.</p>
          </div>
        )}

        {/* Error */}
        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Camera / Preview area */}
        {!done && (
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div>
              <h2 className="font-semibold text-sm">
                {status?.enrolled ? 'Perbarui Wajah' : 'Daftarkan Wajah'}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {inCooldown
                  ? `Pendaftaran ulang tersedia dalam ${daysLeft} hari. Hubungi admin jika perlu reset lebih awal.`
                  : 'Posisikan wajahmu di tengah kamera, pastikan pencahayaan cukup.'}
              </p>
            </div>

            {inCooldown ? (
              <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
                <Clock className="w-10 h-10 text-amber-400" />
                <p className="text-sm text-center">Fitur pendaftaran ulang terkunci selama {daysLeft} hari ke depan.</p>
              </div>
            ) : captured ? (
              /* Preview after capture */
              <div className="flex flex-col items-center gap-4">
                <div className="relative rounded-xl overflow-hidden border w-[320px] h-[240px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={captured.snapshot}
                    alt="Captured face"
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                    Wajah terdeteksi
                  </div>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  Pastikan foto wajahmu jelas. Klik <strong>Simpan</strong> untuk mendaftar.
                </p>

                <div className="flex gap-2 w-[320px]">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleRetake}
                    disabled={enrollMutation.isPending}
                  >
                    <RefreshCw className="w-4 h-4 mr-1.5" />
                    Ulangi
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleEnroll}
                    disabled={enrollMutation.isPending}
                  >
                    {enrollMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 mr-1.5" />
                    )}
                    {enrollMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </div>
              </div>
            ) : (
              /* Camera */
              <div className="flex justify-center">
                <FaceCamera onCapture={handleCapture} captureLabel="Ambil Foto" />
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Catatan</p>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>Data wajahmu disimpan terenkripsi di server.</li>
            <li>Hanya digunakan untuk verifikasi absensi.</li>
            <li>Kamu dapat mendaftarkan ulang kapan saja jika hasil kurang akurat.</li>
            <li>Izinkan akses kamera di browser ketika diminta.</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}
