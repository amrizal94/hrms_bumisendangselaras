'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuditLogs } from '@/hooks/use-face-data'
import type { AuditLogEntry } from '@/types/face'

// ── Action options ─────────────────────────────────────────────────────────────

const ACTION_OPTIONS = [
  { value: 'face',                       label: 'Semua Face Events' },
  { value: 'face.enroll',                label: 'Enroll' },
  { value: 'face.delete',                label: 'Delete' },
  { value: 'face.self_enroll',           label: 'Self-Enroll' },
  { value: 'face.attendance.check_in',   label: 'Check-in' },
  { value: 'face.attendance.check_out',  label: 'Check-out' },
  { value: 'face.attendance.no_match',   label: 'No Match' },
  { value: 'fake_gps',                   label: 'GPS Fraud' },
]

// ── Badge helpers ──────────────────────────────────────────────────────────────

function actionBadgeClass(action: string): string {
  if (action.startsWith('fake_gps'))                    return 'bg-red-100 text-red-700 border-red-300'
  if (action === 'face.attendance.no_match')            return 'bg-orange-100 text-orange-700 border-orange-300'
  if (action === 'face.attendance.check_in')            return 'bg-green-100 text-green-700 border-green-300'
  if (action === 'face.attendance.check_out')           return 'bg-teal-100 text-teal-700 border-teal-300'
  if (action === 'face.self_enroll')                    return 'bg-purple-100 text-purple-700 border-purple-300'
  if (action === 'face.delete')                         return 'bg-red-100 text-red-700 border-red-300'
  if (action === 'face.enroll')                         return 'bg-blue-100 text-blue-700 border-blue-300'
  return 'bg-gray-100 text-gray-700 border-gray-300'
}

function actionLabel(action: string): string {
  return ACTION_OPTIONS.find(o => o.value === action)?.label ?? action
}

// ── Metadata summary ──────────────────────────────────────────────────────────

function MetaSummary({ meta }: { meta: Record<string, unknown> | null }) {
  if (!meta) return <span className="text-muted-foreground text-xs">—</span>

  const parts: string[] = []
  if (typeof meta.confidence === 'number') parts.push(`conf ${meta.confidence.toFixed(1)}%`)
  if (typeof meta.distance   === 'number') parts.push(`dist ${meta.distance.toFixed(3)}`)
  if (typeof meta.detected_via === 'string') parts.push(meta.detected_via)

  if (parts.length === 0) {
    const keys = Object.keys(meta).slice(0, 2)
    keys.forEach(k => parts.push(`${k}: ${String(meta[k])}`))
  }

  return (
    <span className="text-xs text-muted-foreground font-mono">
      {parts.join(' · ') || '—'}
    </span>
  )
}

// ── Row ───────────────────────────────────────────────────────────────────────

function AuditRow({ log }: { log: AuditLogEntry }) {
  const fmtDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZone: 'Asia/Jakarta',
    })
  }

  const targetName = log.target_employee?.name
    ?? log.target_employee?.employee_number
    ?? log.actor?.name
    ?? '—'

  return (
    <TableRow>
      <TableCell className="text-xs whitespace-nowrap">{fmtDate(log.created_at)}</TableCell>
      <TableCell className="text-sm">
        <p className="font-medium">{log.actor?.name ?? '—'}</p>
        <p className="text-xs text-muted-foreground">{log.actor?.email}</p>
      </TableCell>
      <TableCell>
        <Badge className={`text-xs border ${actionBadgeClass(log.action)}`}>
          {actionLabel(log.action)}
        </Badge>
      </TableCell>
      <TableCell className="text-sm">
        {log.target_employee ? (
          <>
            <p className="font-medium">{targetName}</p>
            <p className="text-xs text-muted-foreground">{log.target_employee.employee_number}</p>
          </>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell><MetaSummary meta={log.metadata} /></TableCell>
      <TableCell className="text-xs font-mono text-muted-foreground">{log.ip_address ?? '—'}</TableCell>
    </TableRow>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function AuditLogTab() {
  const [action, setAction] = useState('face')
  const [from, setFrom]     = useState('')
  const [to, setTo]         = useState('')
  const [page, setPage]     = useState(1)

  const { data, isLoading } = useAuditLogs({
    action,
    from: from || undefined,
    to:   to   || undefined,
    page,
  })

  const meta = data?.meta

  function handleActionChange(v: string) {
    setAction(v)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-end">
        <Select value={action} onValueChange={handleActionChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter action" />
          </SelectTrigger>
          <SelectContent>
            {ACTION_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">From</span>
          <Input
            type="date"
            className="w-[150px]"
            value={from}
            onChange={e => { setFrom(e.target.value); setPage(1) }}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">To</span>
          <Input
            type="date"
            className="w-[150px]"
            value={to}
            onChange={e => { setTo(e.target.value); setPage(1) }}
          />
        </div>

        {(from || to) && (
          <Button variant="ghost" size="sm" onClick={() => { setFrom(''); setTo(''); setPage(1) }}>
            Clear dates
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu (WIB)</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Karyawan</TableHead>
              <TableHead>Detail</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
              </TableRow>
            )}
            {!isLoading && (!data?.data || data.data.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Tidak ada log.</TableCell>
              </TableRow>
            )}
            {data?.data?.map(log => <AuditRow key={log.id} log={log} />)}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {meta.total} log · Halaman {meta.current_page} / {meta.last_page}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  )
}
