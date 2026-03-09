'use client'

import { useState } from 'react'
import { Plus, Check, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import {
  useCompleteFinanceBudgetProject,
  useCreateFinanceBudgetProject,
  useDeleteFinanceBudgetProject,
  useFinanceAccounts,
  useFinanceBudgetProjects,
} from '@/hooks/use-finance'
import type { BudgetProjectFilters, BudgetProjectStatus, FinanceBudgetProject } from '@/types/finance'

function fmtCurrency(v: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v)
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS_STYLES: Record<BudgetProjectStatus, { label: string; className: string }> = {
  planning:  { label: 'Perencanaan', className: 'bg-blue-100 text-blue-700' },
  active:    { label: 'Aktif',       className: 'bg-emerald-100 text-emerald-700' },
  completed: { label: 'Selesai',     className: 'bg-slate-100 text-slate-600' },
  cancelled: { label: 'Dibatalkan',  className: 'bg-red-100 text-red-700' },
}

function AddProjectDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { data: accounts = [] } = useFinanceAccounts()
  const createMutation = useCreateFinanceBudgetProject()

  const [form, setForm] = useState({
    account_id:   '',
    name:         '',
    description:  '',
    total_budget: '',
    start_date:   '',
    end_date:     '',
    status:       'planning' as BudgetProjectStatus,
    notes:        '',
  })

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function handleSubmit() {
    createMutation.mutate(
      {
        account_id:   parseInt(form.account_id),
        name:         form.name,
        description:  form.description || undefined,
        total_budget: parseFloat(form.total_budget),
        start_date:   form.start_date,
        end_date:     form.end_date || undefined,
        status:       form.status,
        notes:        form.notes || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false)
          setForm({ account_id: '', name: '', description: '', total_budget: '', start_date: '', end_date: '', status: 'planning', notes: '' })
        },
      }
    )
  }

  const isValid = form.account_id && form.name && form.total_budget && form.start_date

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Budget Proyek</DialogTitle>
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
            <Label>Nama Proyek *</Label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Nama proyek..." />
          </div>
          <div className="space-y-1">
            <Label>Deskripsi</Label>
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} placeholder="Opsional..." />
          </div>
          <div className="space-y-1">
            <Label>Total Budget (IDR) *</Label>
            <Input type="number" value={form.total_budget} onChange={(e) => set('total_budget', e.target.value)} placeholder="0" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Tanggal Mulai *</Label>
              <Input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Tanggal Selesai</Label>
              <Input type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Perencanaan</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Catatan</Label>
            <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} placeholder="Opsional..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSubmit} disabled={!isValid || createMutation.isPending}>
            {createMutation.isPending ? 'Menyimpan…' : 'Buat Proyek'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ProjectCard({ project }: { project: FinanceBudgetProject }) {
  const completeMutation = useCompleteFinanceBudgetProject()
  const deleteMutation   = useDeleteFinanceBudgetProject()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const st = STATUS_STYLES[project.status]
  const usageColor = project.usage_percent >= 90 ? 'bg-red-500' : project.usage_percent >= 70 ? 'bg-amber-500' : 'bg-emerald-500'

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-sm">{project.name}</p>
              <p className="text-xs text-muted-foreground">{project.account?.name}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${st.className}`}>{st.label}</span>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Terpakai</span>
              <span className="font-medium">{project.usage_percent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${usageColor}`}
                style={{ width: `${Math.min(project.usage_percent, 100)}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Total Budget</p>
              <p className="font-semibold text-sm">{fmtCurrency(project.total_budget)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Terpakai</p>
              <p className="font-semibold text-sm text-red-600">{fmtCurrency(project.spent_amount)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Sisa</p>
              <p className={`font-semibold text-sm ${project.remaining_budget < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {fmtCurrency(project.remaining_budget)}
              </p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {fmtDate(project.start_date)}
            {project.end_date && ` — ${fmtDate(project.end_date)}`}
          </div>
          {project.assignedBy && (
            <p className="text-xs text-muted-foreground">PIC: {project.assignedBy.name}</p>
          )}
          <div className="flex gap-2 pt-1">
            {project.status === 'active' && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-xs text-emerald-600 border-emerald-300"
                disabled={completeMutation.isPending}
                onClick={() => completeMutation.mutate(project.id)}
              >
                <Check className="w-3.5 h-3.5 mr-1" /> Selesai
              </Button>
            )}
            {project.status !== 'completed' && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-red-500"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Hapus Proyek</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Yakin hapus proyek <span className="font-semibold">{project.name}</span>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(project.id, { onSuccess: () => setDeleteOpen(false) })}
            >
              {deleteMutation.isPending ? 'Menghapus…' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function FinanceBudgetProjectsPage() {
  const [filters, setFilters] = useState<BudgetProjectFilters>({ page: 1, per_page: 12 })
  const [addOpen, setAddOpen] = useState(false)

  const { data: accounts = [] } = useFinanceAccounts()
  const { data, isLoading }     = useFinanceBudgetProjects(filters)

  const projects = data?.data ?? []
  const meta     = data?.meta

  return (
    <DashboardLayout title="Budget Proyek" allowedRoles={['admin', 'director']}>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Tambah Proyek
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
            value={(filters.status as string) ?? 'all'}
            onValueChange={(v) => setFilters((f) => ({ ...f, status: v === 'all' ? undefined : v as BudgetProjectStatus, page: 1 }))}
          >
            <SelectTrigger className="w-40"><SelectValue placeholder="Semua Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="planning">Perencanaan</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="completed">Selesai</SelectItem>
              <SelectItem value="cancelled">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <div className="h-5 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                  <div className="h-3 bg-muted animate-pulse rounded w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              Belum ada budget proyek.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}

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

      <AddProjectDialog open={addOpen} onOpenChange={setAddOpen} />
    </DashboardLayout>
  )
}
