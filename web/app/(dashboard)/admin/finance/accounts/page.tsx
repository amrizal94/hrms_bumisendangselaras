'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Building2, Wallet, CreditCard, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import {
  useCreateFinanceAccount,
  useDeleteFinanceAccount,
  useFinanceAccounts,
  useUpdateFinanceAccount,
} from '@/hooks/use-finance'
import type { AccountType, FinanceAccount } from '@/types/finance'

function fmtCurrency(v: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v)
}

const TYPE_LABELS: Record<AccountType, string> = {
  bank:       'Bank',
  cash:       'Kas',
  'e-wallet': 'E-Wallet',
  other:      'Lainnya',
}

const TYPE_ICONS: Record<AccountType, React.ElementType> = {
  bank:       Building2,
  cash:       Wallet,
  'e-wallet': CreditCard,
  other:      MoreHorizontal,
}

const TYPE_COLORS: Record<AccountType, string> = {
  bank:       'bg-blue-100 text-blue-700',
  cash:       'bg-emerald-100 text-emerald-700',
  'e-wallet': 'bg-purple-100 text-purple-700',
  other:      'bg-slate-100 text-slate-600',
}

const INITIAL_FORM = {
  name: '',
  type: 'bank' as AccountType,
  bank_name: '',
  account_number: '',
  account_holder: '',
  balance: '',
  description: '',
}

function AccountFormDialog({
  open,
  onOpenChange,
  account,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  account?: FinanceAccount | null
}) {
  const isEdit = !!account
  const [form, setForm] = useState({
    name:           account?.name ?? '',
    type:           (account?.type ?? 'bank') as AccountType,
    bank_name:      account?.bank_name ?? '',
    account_number: account?.account_number ?? '',
    account_holder: account?.account_holder ?? '',
    balance:        account ? String(account.balance) : '',
    description:    account?.description ?? '',
  })

  const createMutation = useCreateFinanceAccount()
  const updateMutation = useUpdateFinanceAccount()
  const isPending = createMutation.isPending || updateMutation.isPending

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function handleSubmit() {
    const payload = {
      name:           form.name,
      type:           form.type,
      bank_name:      form.bank_name || undefined,
      account_number: form.account_number || undefined,
      account_holder: form.account_holder || undefined,
      balance:        form.balance ? parseFloat(form.balance) : undefined,
      description:    form.description || undefined,
    }

    if (isEdit && account) {
      updateMutation.mutate(
        { id: account.id, payload },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      createMutation.mutate(payload as Parameters<typeof createMutation.mutate>[0], {
        onSuccess: () => {
          onOpenChange(false)
          setForm(INITIAL_FORM)
        },
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Rekening' : 'Tambah Rekening'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Nama Rekening *</Label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Rekening Utama BCA" />
          </div>
          <div className="space-y-1">
            <Label>Tipe *</Label>
            <Select value={form.type} onValueChange={(v) => set('type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="cash">Kas</SelectItem>
                <SelectItem value="e-wallet">E-Wallet</SelectItem>
                <SelectItem value="other">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Nama Bank</Label>
              <Input value={form.bank_name} onChange={(e) => set('bank_name', e.target.value)} placeholder="BCA" />
            </div>
            <div className="space-y-1">
              <Label>No. Rekening</Label>
              <Input value={form.account_number} onChange={(e) => set('account_number', e.target.value)} placeholder="1234567890" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Atas Nama</Label>
            <Input value={form.account_holder} onChange={(e) => set('account_holder', e.target.value)} placeholder="PT Bumi Sendang Selaras" />
          </div>
          {!isEdit && (
            <div className="space-y-1">
              <Label>Saldo Awal</Label>
              <Input type="number" value={form.balance} onChange={(e) => set('balance', e.target.value)} placeholder="0" />
            </div>
          )}
          <div className="space-y-1">
            <Label>Keterangan</Label>
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} placeholder="Opsional..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSubmit} disabled={isPending || !form.name}>
            {isPending ? 'Menyimpan…' : isEdit ? 'Simpan' : 'Tambah'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function FinanceAccountsPage() {
  const { data: accounts = [], isLoading } = useFinanceAccounts()
  const deleteMutation = useDeleteFinanceAccount()

  const [formOpen, setFormOpen]     = useState(false)
  const [editTarget, setEditTarget] = useState<FinanceAccount | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FinanceAccount | null>(null)

  function openEdit(acc: FinanceAccount) {
    setEditTarget(acc)
    setFormOpen(true)
  }

  function handleFormClose(open: boolean) {
    setFormOpen(open)
    if (!open) setEditTarget(null)
  }

  return (
    <DashboardLayout title="Rekening Keuangan" allowedRoles={['admin', 'director']}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {accounts.length} rekening terdaftar
          </p>
          <Button size="sm" onClick={() => { setEditTarget(null); setFormOpen(true) }}>
            <Plus className="w-4 h-4 mr-2" /> Tambah Rekening
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <div className="space-y-3">
                    <div className="h-5 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                    <div className="h-7 bg-muted animate-pulse rounded w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              Belum ada rekening. Tambahkan rekening pertama Anda.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acc) => {
              const Icon = TYPE_ICONS[acc.type] ?? Wallet
              return (
                <Card key={acc.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2 pt-5 px-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${TYPE_COLORS[acc.type]}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{acc.name}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${TYPE_COLORS[acc.type]}`}>
                            {TYPE_LABELS[acc.type]}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(acc)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={() => setDeleteTarget(acc)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <p className="text-2xl font-bold text-primary mb-2">{fmtCurrency(acc.balance)}</p>
                    {acc.bank_name && (
                      <p className="text-xs text-muted-foreground">{acc.bank_name}</p>
                    )}
                    {acc.account_number && (
                      <p className="text-xs text-muted-foreground font-mono">{acc.account_number}</p>
                    )}
                    {acc.account_holder && (
                      <p className="text-xs text-muted-foreground">{acc.account_holder}</p>
                    )}
                    {!acc.is_active && (
                      <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        Tidak Aktif
                      </span>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <AccountFormDialog
        open={formOpen}
        onOpenChange={handleFormClose}
        account={editTarget}
      />

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Rekening</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Yakin ingin menghapus rekening <span className="font-semibold">{deleteTarget?.name}</span>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (!deleteTarget) return
                deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })
              }}
            >
              {deleteMutation.isPending ? 'Menghapus…' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
