'use client'

import { useState } from 'react'
import { Plus, Check, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import {
  useApproveFinanceExpenditure,
  useCreateFinanceExpenditure,
  useDeleteFinanceExpenditure,
  useFinanceAccounts,
  useFinanceBudgetProjects,
  useFinanceCategories,
  useFinanceExpenditures,
  useRejectFinanceExpenditure,
} from '@/hooks/use-finance'
import type { FinanceExpenditure, FinanceExpenditureFilters, FinanceStatus } from '@/types/finance'

function fmtCurrency(v: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v)
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS_STYLES: Record<FinanceStatus, { label: string; className: string }> = {
  pending:  { label: 'Pending',   className: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Disetujui', className: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Ditolak',   className: 'bg-red-100 text-red-700' },
}

function AddExpenditureDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { data: accounts = [] }  = useFinanceAccounts()
  const { data: projectsData }   = useFinanceBudgetProjects({ status: 'active', per_page: 100 })
  const { data: categories = [] }= useFinanceCategories({ type: 'expense' })
  const createMutation           = useCreateFinanceExpenditure()

  const projects = projectsData?.data ?? []

  const [form, setForm] = useState({
    account_id:        '',
    budget_project_id: '',
    category_id:       '',
    amount:            '',
    date:              '',
    vendor:            '',
    reference_number:  '',
    description:       '',
  })

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function handleSubmit() {
    createMutation.mutate(
      {
        account_id:        parseInt(form.account_id),
        budget_project_id: form.budget_project_id ? parseInt(form.budget_project_id) : undefined,
        category_id:       parseInt(form.category_id),
        amount:            parseFloat(form.amount),
        date:              form.date,
        vendor:            form.vendor || undefined,
        reference_number:  form.reference_number || undefined,
        description:       form.description || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false)
          setForm({ account_id: '', budget_project_id: '', category_id: '', amount: '', date: '', vendor: '', reference_number: '', description: '' })
        },
      }
    )
  }

  const isValid = form.account_id && form.category_id && form.amount && form.date

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Pengeluaran</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Rekening *</Label>
            <Select value={form.account_id} onValueChange={(v) => set('account_id', v)}>
              <SelectTrigger><SelectValue placeholder="Pilih rekening..." /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Budget Proyek (opsional)</Label>
            <Select value={form.budget_project_id || 'none'} onValueChange={(v) => set('budget_project_id', v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Tidak terhubung ke proyek" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tidak terhubung ke proyek</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Kategori *</Label>
            <Select value={form.category_id} onValueChange={(v) => set('category_id', v)}>
              <SelectTrigger><SelectValue placeholder="Pilih kategori..." /></SelectTrigger>
              <SelectContent>
                {categories.filter((c) => c.type === 'expense').map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Jumlah (IDR) *</Label>
              <Input type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label>Tanggal *</Label>
              <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Vendor / Penerima</Label>
            <Input value={form.vendor} onChange={(e) => set('vendor', e.target.value)} placeholder="Nama vendor atau penerima..." />
          </div>
          <div className="space-y-1">
            <Label>No. Referensi</Label>
            <Input value={form.reference_number} onChange={(e) => set('reference_number', e.target.value)} placeholder="Opsional" />
          </div>
          <div className="space-y-1">
            <Label>Keterangan</Label>
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} placeholder="Opsional..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSubmit} disabled={!isValid || createMutation.isPending}>
            {createMutation.isPending ? 'Menyimpan…' : 'Tambah'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function FinanceExpendituresPage() {
  const [filters, setFilters] = useState<FinanceExpenditureFilters>({ page: 1, per_page: 15 })
  const [addOpen, setAddOpen]           = useState(false)
  const [rejectTarget, setRejectTarget] = useState<FinanceExpenditure | null>(null)
  const [rejectNote, setRejectNote]     = useState('')

  const { data: accounts = [] }   = useFinanceAccounts()
  const { data: projectsData }    = useFinanceBudgetProjects({ per_page: 100 })
  const { data: categories = [] } = useFinanceCategories({ type: 'expense' })
  const { data, isLoading }       = useFinanceExpenditures(filters)
  const approveMutation           = useApproveFinanceExpenditure()
  const rejectMutation            = useRejectFinanceExpenditure()
  const deleteMutation            = useDeleteFinanceExpenditure()

  const projects     = projectsData?.data ?? []
  const expenditures = data?.data ?? []
  const meta         = data?.meta

  return (
    <DashboardLayout title="Pengeluaran" allowedRoles={['admin', 'director']}>
      <div className="space-y-4">

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Tambah Pengeluaran
          </Button>

          <Select
            value={String(filters.account_id ?? 'all')}
            onValueChange={(v) => setFilters((f) => ({ ...f, account_id: v === 'all' ? undefined : parseInt(v), page: 1 }))}
          >
            <SelectTrigger className="w-44"><SelectValue placeholder="Semua Rekening" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Rekening</SelectItem>
              {accounts.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select
            value={String(filters.budget_project_id ?? 'all')}
            onValueChange={(v) => setFilters((f) => ({ ...f, budget_project_id: v === 'all' ? undefined : parseInt(v), page: 1 }))}
          >
            <SelectTrigger className="w-44"><SelectValue placeholder="Semua Proyek" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Proyek</SelectItem>
              {projects.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select
            value={String(filters.category_id ?? 'all')}
            onValueChange={(v) => setFilters((f) => ({ ...f, category_id: v === 'all' ? undefined : parseInt(v), page: 1 }))}
          >
            <SelectTrigger className="w-44"><SelectValue placeholder="Semua Kategori" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories.filter((c) => c.type === 'expense').map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={(filters.status as string) ?? 'all'}
            onValueChange={(v) => setFilters((f) => ({ ...f, status: v === 'all' ? undefined : v as FinanceStatus, page: 1 }))}
          >
            <SelectTrigger className="w-36"><SelectValue placeholder="Semua Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Disetujui</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            className="w-40"
            value={filters.date_from ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value || undefined, page: 1 }))}
          />
          <Input
            type="date"
            className="w-40"
            value={filters.date_to ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value || undefined, page: 1 }))}
          />
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Deskripsi / Vendor</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead>Rekening</TableHead>
                  <TableHead>Proyek</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Memuat…</TableCell>
                  </TableRow>
                )}
                {!isLoading && expenditures.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Belum ada data pengeluaran.</TableCell>
                  </TableRow>
                )}
                {expenditures.map((exp) => {
                  const st = STATUS_STYLES[exp.status]
                  return (
                    <TableRow key={exp.id}>
                      <TableCell className="whitespace-nowrap">{fmtDate(exp.date)}</TableCell>
                      <TableCell>
                        <p className="font-medium text-sm max-w-[180px] truncate">
                          {exp.description ?? exp.vendor ?? '—'}
                        </p>
                        {exp.vendor && exp.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[180px]">{exp.vendor}</p>
                        )}
                        {exp.reference_number && (
                          <p className="text-xs text-muted-foreground font-mono">{exp.reference_number}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-red-600">{fmtCurrency(exp.amount)}</TableCell>
                      <TableCell className="text-sm">{exp.account?.name ?? '—'}</TableCell>
                      <TableCell className="text-sm">{exp.budgetProject?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="text-sm">{exp.category?.name ?? '—'}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.className}`}>
                          {st.label}
                        </span>
                        {exp.status === 'rejected' && exp.rejection_note && (
                          <p className="text-xs text-red-500 mt-0.5 max-w-[120px] truncate" title={exp.rejection_note}>
                            {exp.rejection_note}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {exp.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                className="h-7 px-2 bg-emerald-600 hover:bg-emerald-700"
                                disabled={approveMutation.isPending}
                                onClick={() => approveMutation.mutate(exp.id)}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-red-600 border-red-300 hover:bg-red-50"
                                onClick={() => { setRejectTarget(exp); setRejectNote('') }}
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-red-400"
                                disabled={deleteMutation.isPending}
                                onClick={() => deleteMutation.mutate(exp.id)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Halaman {meta.current_page} dari {meta.last_page} ({meta.total} total)
            </p>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" disabled={meta.current_page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" disabled={meta.current_page >= meta.last_page}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <AddExpenditureDialog open={addOpen} onOpenChange={setAddOpen} />

      {/* Reject Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(v) => { if (!v) setRejectTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Tolak Pengeluaran</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Tolak pengeluaran <span className="font-semibold">{rejectTarget ? fmtCurrency(rejectTarget.amount) : ''}</span>
              {rejectTarget?.vendor && <> dari <span className="font-semibold">{rejectTarget.vendor}</span></>}?
            </p>
            <div className="space-y-1">
              <Label>Alasan Penolakan</Label>
              <Textarea rows={3} value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Tulis alasan..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Batal</Button>
            <Button
              variant="destructive"
              disabled={!rejectNote.trim() || rejectMutation.isPending}
              onClick={() => {
                if (!rejectTarget) return
                rejectMutation.mutate(
                  { id: rejectTarget.id, note: rejectNote.trim() },
                  { onSuccess: () => setRejectTarget(null) }
                )
              }}
            >
              {rejectMutation.isPending ? 'Menolak…' : 'Tolak'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
