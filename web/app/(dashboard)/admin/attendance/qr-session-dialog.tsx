'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { QrCode, Power, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { Input } from '@/components/ui/input'
import { useDeactivateQrSession, useGenerateQrSession, useQrSessions } from '@/hooks/use-qr-sessions'
import type { QrSession, QrSessionType } from '@/types/qr-session'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

/** Combine date string + time string into 'YYYY-MM-DD HH:mm:ss' */
function toDatetimeStr(date: string, time: string): string {
  return `${date} ${time}:00`
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

export function QrSessionDialog({ open, onOpenChange }: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [type, setType]           = useState<QrSessionType>('check_in')
  const [date, setDate]           = useState(todayStr())
  const [fromTime, setFromTime]   = useState('07:00')
  const [untilTime, setUntilTime] = useState('09:00')
  const [generated, setGenerated] = useState<QrSession | null>(null)
  const [error, setError]         = useState<string | null>(null)

  const { data: sessions = [] }   = useQrSessions(date)
  const generateMutation          = useGenerateQrSession()
  const deactivateMutation        = useDeactivateQrSession()

  function handleGenerate() {
    setError(null)
    generateMutation.mutate(
      {
        type,
        date,
        valid_from:  toDatetimeStr(date, fromTime),
        valid_until: toDatetimeStr(date, untilTime),
      },
      {
        onSuccess: (session) => setGenerated(session),
        onError: (e: unknown) => {
          const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
          setError(msg ?? 'Failed to generate QR session')
        },
      }
    )
  }

  function handleDeactivate(id: number) {
    deactivateMutation.mutate(id, {
      onSuccess: () => {
        if (generated?.id === id) setGenerated(null)
      },
    })
  }

  function handleClose() {
    setGenerated(null)
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR Attendance Session
          </DialogTitle>
        </DialogHeader>

        {/* Form */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Type</label>
            <Select value={type} onValueChange={(v) => { setType(v as QrSessionType); setGenerated(null) }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="check_in">Check-In</SelectItem>
                <SelectItem value="check_out">Check-Out</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Date</label>
            <Input type="date" value={date} onChange={(e) => { setDate(e.target.value); setGenerated(null) }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Valid From</label>
              <Input type="time" value={fromTime} onChange={(e) => { setFromTime(e.target.value); setGenerated(null) }} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Valid Until</label>
              <Input type="time" value={untilTime} onChange={(e) => { setUntilTime(e.target.value); setGenerated(null) }} />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            className="w-full"
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? 'Generating…' : 'Generate QR'}
          </Button>
        </div>

        {/* Generated QR display */}
        {generated && (
          <div className="mt-4 flex flex-col items-center gap-3 p-4 border rounded-lg bg-muted/30">
            <p className="text-sm font-medium text-center">
              {generated.type === 'check_in' ? 'Check-In' : 'Check-Out'} QR —{' '}
              {formatTime(generated.valid_from)} – {formatTime(generated.valid_until)}
            </p>
            <div className="bg-white p-3 rounded-lg">
              <QRCodeSVG value={generated.token} size={200} />
            </div>
            <p className="text-xs text-muted-foreground text-center break-all font-mono">{generated.token}</p>
            {generated.is_active ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">Active</span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Inactive</span>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full text-destructive hover:text-destructive"
              onClick={() => handleDeactivate(generated.id)}
              disabled={!generated.is_active || deactivateMutation.isPending}
            >
              <Power className="w-3.5 h-3.5 mr-1" />
              Deactivate
            </Button>
          </div>
        )}

        {/* Today's sessions list */}
        {sessions.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Sessions on {date}</p>
            <div className="space-y-2">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm border rounded-lg px-3 py-2 bg-muted/20">
                  <div>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium mr-2 ${
                      s.type === 'check_in' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {s.type === 'check_in' ? 'In' : 'Out'}
                    </span>
                    <span className="text-muted-foreground">
                      {formatTime(s.valid_from)}–{formatTime(s.valid_until)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${s.is_active ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {s.is_active && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeactivate(s.id)}
                        disabled={deactivateMutation.isPending}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
