'use client'

import { useState } from 'react'
import { History, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAllAuditLogs } from '@/hooks/use-audit-log'
import type { AuditLogParams } from '@/types/audit-log'

// ─────────────────────────────────────────────────────────────────
// Category → action prefix mapping
// ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'all',        label: 'Semua' },
  { key: 'employee',   label: 'Karyawan' },
  { key: 'leave',      label: 'Cuti' },
  { key: 'expense',    label: 'Expense' },
  { key: 'attendance', label: 'Absensi' },
  { key: 'payroll',    label: 'Payroll' },
  { key: 'task',       label: 'Task' },
  { key: 'face',       label: 'Face' },
] as const

// ─────────────────────────────────────────────────────────────────
// Badge styling by action type
// ─────────────────────────────────────────────────────────────────
function actionBadge(action: string) {
  const lower = action.toLowerCase()
  if (lower.includes('create') || lower.includes('approve') || lower.includes('activate') || lower.includes('enroll')) {
    return 'bg-emerald-100 text-emerald-700'
  }
  if (lower.includes('delete') || lower.includes('reject') || lower.includes('deactivate') || lower.includes('fake_gps')) {
    return 'bg-red-100 text-red-700'
  }
  if (lower.includes('update') || lower.includes('paid') || lower.includes('generate') || lower.includes('finalize')) {
    return 'bg-amber-100 text-amber-700'
  }
  return 'bg-slate-100 text-slate-600'
}

// ─────────────────────────────────────────────────────────────────
// Human-readable action labels
// ─────────────────────────────────────────────────────────────────
const ACTION_LABELS: Record<string, string> = {
  'employee.create':     'Tambah Karyawan',
  'employee.update':     'Edit Karyawan',
  'employee.delete':     'Hapus Karyawan',
  'employee.activate':   'Aktifkan Akun',
  'employee.deactivate': 'Nonaktifkan Akun',
  'leave.approve':       'Setujui Cuti',
  'leave.reject':        'Tolak Cuti',
  'expense.approve':     'Setujui Expense',
  'expense.reject':      'Tolak Expense',
  'attendance.create':   'Tambah Absensi',
  'attendance.update':   'Edit Absensi',
  'attendance.delete':   'Hapus Absensi',
  'payroll.generate':    'Generate Payroll',
  'payroll.paid':        'Tandai Dibayar',
  'task.create':         'Buat Task',
  'task.delete':         'Hapus Task',
  'face.enroll':         'Enroll Wajah',
  'face.delete':         'Hapus Wajah',
  'fake_gps.attempt':    'GPS Palsu Terdeteksi',
}

function formatAction(action: string) {
  return ACTION_LABELS[action] ?? action
}

// ─────────────────────────────────────────────────────────────────
// Build a short "detail" string from metadata
// ─────────────────────────────────────────────────────────────────
function metaDetail(metadata: Record<string, unknown> | null): string {
  if (!metadata) return '—'
  const parts: string[] = []
  if (metadata.target_label) parts.push(String(metadata.target_label))
  if (metadata.leave_type)   parts.push(String(metadata.leave_type))
  if (metadata.dates)        parts.push(String(metadata.dates))
  if (metadata.total_days)   parts.push(`${metadata.total_days} hari`)
  if (metadata.amount)       parts.push(`Rp ${Number(metadata.amount).toLocaleString('id-ID')}`)
  if (metadata.category)     parts.push(String(metadata.category))
  if (metadata.rejection_reason) parts.push(`Alasan: ${String(metadata.rejection_reason)}`)
  if (metadata.period)       parts.push(`Periode ${metadata.period}`)
  if (metadata.created && !metadata.created) parts.push(`Dibuat: ${metadata.created}`)
  if (metadata.count)        parts.push(`${metadata.count} record`)
  if (metadata.changed_fields && Array.isArray(metadata.changed_fields)) {
    parts.push(`Field: ${(metadata.changed_fields as string[]).join(', ')}`)
  }
  if (metadata.project)      parts.push(`Project: ${metadata.project}`)
  return parts.length ? parts.join(' · ') : '—'
}

function formatDt(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────
export default function ActivityLogPage() {
  const [category, setCategory] = useState<string>('all')
  const [from, setFrom]         = useState('')
  const [to, setTo]             = useState('')
  const [page, setPage]         = useState(1)

  const params: AuditLogParams = {
    action: category,
    from:   from || undefined,
    to:     to   || undefined,
    page,
    per_page: 30,
  }

  const { data, isLoading } = useAllAuditLogs(params)

  const entries = data?.data ?? []
  const meta    = data?.meta

  function handleCategory(key: string) {
    setCategory(key)
    setPage(1)
  }

  return (
    <DashboardLayout title="Activity Log" allowedRoles={['admin', 'hr', 'director']}>
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-muted-foreground" />
            Activity Log
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Audit trail semua perubahan data — siapa, kapan, apa
          </p>
        </div>

        {/* Category filter chips */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => handleCategory(cat.key)}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                category === cat.key
                  ? 'bg-primary text-white border-primary'
                  : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Date range filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Dari</span>
            <Input
              type="date"
              className="w-38 h-8"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPage(1) }}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Sampai</span>
            <Input
              type="date"
              className="w-38 h-8"
              value={to}
              onChange={(e) => { setTo(e.target.value); setPage(1) }}
            />
          </div>
          {(from || to) && (
            <Button variant="ghost" size="sm" onClick={() => { setFrom(''); setTo(''); setPage(1) }}>
              Reset
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-44">Waktu</TableHead>
                <TableHead>Oleh</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead className="w-32">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    Belum ada log aktivitas.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id} className="hover:bg-muted/30 align-top">
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap py-3">
                      {formatDt(entry.created_at)}
                    </TableCell>
                    <TableCell className="text-sm py-3">
                      {entry.actor ? (
                        <div>
                          <p className="font-medium">{entry.actor.name}</p>
                          <p className="text-xs text-muted-foreground">{entry.actor.email}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${actionBadge(entry.action)}`}>
                        {formatAction(entry.action)}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground py-3 max-w-xs">
                      {metaDetail(entry.metadata)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono py-3">
                      {entry.ip_address ?? '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Menampilkan {(meta.current_page - 1) * meta.per_page + 1}–
              {Math.min(meta.current_page * meta.per_page, meta.total)} dari {meta.total}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8"
                disabled={meta.current_page <= 1}
                onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span>{meta.current_page} / {meta.last_page}</span>
              <Button variant="outline" size="icon" className="h-8 w-8"
                disabled={meta.current_page >= meta.last_page}
                onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
