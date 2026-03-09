'use client'

import dynamic from 'next/dynamic'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, Calendar, User, Building2, Briefcase, AlertTriangle } from 'lucide-react'
import type { AttendanceRecord } from '@/types/attendance'

const LocationMap = dynamic(() => import('@/components/ui/location-map'), { ssr: false })

interface AttendanceDetailSheetProps {
  record: AttendanceRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STATUS_STYLES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  present:  { label: 'Present',  variant: 'default' },
  late:     { label: 'Late',     variant: 'secondary' },
  absent:   { label: 'Absent',   variant: 'destructive' },
  half_day: { label: 'Half Day', variant: 'outline' },
  on_leave: { label: 'On Leave', variant: 'outline' },
}

const METHOD_LABELS: Record<string, string> = {
  face:   'Face Recognition',
  manual: 'Manual',
  admin:  'Admin Entry',
  qr:     'QR Code',
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function formatCoord(val: number): string {
  return val.toFixed(6)
}

export function AttendanceDetailSheet({ record, open, onOpenChange }: AttendanceDetailSheetProps) {
  if (!record) return null

  const hasGps = record.latitude != null && record.longitude != null
  const status = STATUS_STYLES[record.status]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-2">
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Detail Absensi
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Employee Info */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="font-semibold">{record.employee?.user.name ?? '—'}</span>
              <span className="text-muted-foreground font-mono text-xs">
                {record.employee?.employee_number}
              </span>
            </div>
            {record.employee?.department && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span>{record.employee.department.name}</span>
              </div>
            )}
            {record.employee?.position && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5 shrink-0" />
                <span>{record.employee.position}</span>
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>Tanggal</span>
              </div>
              <span className="text-sm font-medium">{record.date}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Check-in</span>
              </div>
              <span className="text-sm font-mono font-medium">{formatTime(record.check_in)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Check-out</span>
              </div>
              <span className="text-sm font-mono font-medium">{formatTime(record.check_out)}</span>
            </div>
            {record.work_hours && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Jam Kerja</span>
                <span className="text-sm font-medium">{record.work_hours}h</span>
              </div>
            )}
          </div>

          {/* Status & Method */}
          <div className="flex items-center gap-2 flex-wrap">
            {status && <Badge variant={status.variant}>{status.label}</Badge>}
            {record.check_in_method && (
              <Badge variant="outline">{METHOD_LABELS[record.check_in_method] ?? record.check_in_method}</Badge>
            )}
            {record.is_mock_location && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                GPS Palsu
              </Badge>
            )}
          </div>

          {/* Notes */}
          {record.notes && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Catatan</p>
              <p className="text-sm bg-muted/40 rounded-md px-3 py-2">{record.notes}</p>
            </div>
          )}

          {/* GPS Location Map */}
          {hasGps && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Lokasi Check-in</span>
              </div>

              <LocationMap
                lat={record.latitude!}
                lng={record.longitude!}
                accuracy={record.location_accuracy}
                isMock={record.is_mock_location ?? false}
                label={`Check-in — ${record.employee?.user.name ?? ''}`}
                height={220}
              />

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>
                  <span className="font-medium text-foreground">Lat:</span>{' '}
                  {formatCoord(record.latitude!)}
                </span>
                <span>
                  <span className="font-medium text-foreground">Lng:</span>{' '}
                  {formatCoord(record.longitude!)}
                </span>
                {record.location_accuracy != null && (
                  <span>
                    <span className="font-medium text-foreground">Akurasi:</span>{' '}
                    ±{Math.round(record.location_accuracy)}m
                  </span>
                )}
              </div>
            </div>
          )}

          {!hasGps && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Tidak ada data GPS untuk record ini.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
