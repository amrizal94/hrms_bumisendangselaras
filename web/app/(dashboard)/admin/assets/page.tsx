'use client'

import { useState, useCallback } from 'react'
import { API_BASE_URL, TOKEN_KEY } from '@/lib/constants'
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Search,
  ArrowDownToLine,
  ArrowUpFromLine,
  Download,
  ArchiveX,
} from 'lucide-react'
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import {
  useAssets,
  useAssetStats,
  useAssetCategories,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
  useDisposeAsset,
  useAssignAsset,
  useReturnAsset,
  useCreateAssetCategory,
  useUpdateAssetCategory,
  useDeleteAssetCategory,
} from '@/hooks/use-assets'
import { useEmployees } from '@/hooks/use-employees'
import type { Asset, AssetCategory, AssetCondition, AssetFilters, AssetStatus } from '@/types/asset'
import { assignedByName } from '@/types/asset'

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(s: string | null | undefined) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtCurrency(v: string | number | null | undefined) {
  if (v === null || v === undefined || v === '') return '—'
  const num = typeof v === 'string' ? parseFloat(v) : v
  if (isNaN(num)) return '—'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num)
}

const STATUS_STYLES: Record<AssetStatus, { label: string; className: string }> = {
  available:   { label: 'Tersedia',    className: 'bg-emerald-100 text-emerald-700' },
  in_use:      { label: 'Dipakai',     className: 'bg-blue-100 text-blue-700' },
  maintenance: { label: 'Maintenance', className: 'bg-amber-100 text-amber-700' },
  disposed:    { label: 'Dibuang',     className: 'bg-gray-100 text-gray-500' },
}

const CONDITION_STYLES: Record<AssetCondition, { label: string; className: string }> = {
  good: { label: 'Baik',   className: 'bg-emerald-100 text-emerald-700' },
  fair: { label: 'Cukup',  className: 'bg-amber-100 text-amber-700' },
  poor: { label: 'Buruk',  className: 'bg-red-100 text-red-700' },
}

function StatusBadge({ status }: { status: AssetStatus }) {
  const s = STATUS_STYLES[status] ?? { label: status, className: 'bg-gray-100 text-gray-500' }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  )
}

function ConditionBadge({ condition }: { condition: AssetCondition }) {
  const c = CONDITION_STYLES[condition] ?? { label: condition, className: 'bg-gray-100 text-gray-500' }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.className}`}>
      {c.label}
    </span>
  )
}

// ── Add/Edit Asset Dialog ────────────────────────────────────────────────────
function AddEditAssetDialog({
  asset,
  open,
  onOpenChange,
}: {
  asset: Asset | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: categories = [] } = useAssetCategories()
  const createMutation = useCreateAsset()
  const updateMutation = useUpdateAsset()

  const [name, setName]                   = useState(asset?.name ?? '')
  const [assetCode, setAssetCode]         = useState(asset?.asset_code ?? '')
  const [categoryId, setCategoryId]       = useState(String(asset?.asset_category_id ?? 'none'))
  const [serialNumber, setSerialNumber]   = useState(asset?.serial_number ?? '')
  const [brand, setBrand]                 = useState(asset?.brand ?? '')
  const [model, setModel]                 = useState(asset?.model ?? '')
  const [purchaseDate, setPurchaseDate]   = useState(asset?.purchase_date ?? '')
  const [purchasePrice, setPurchasePrice] = useState(asset?.purchase_price ?? '')
  const [warrantyUntil, setWarrantyUntil] = useState(asset?.warranty_until ?? '')
  const [condition, setCondition]         = useState<AssetCondition>(asset?.condition ?? 'good')
  const [notes, setNotes]                 = useState(asset?.notes ?? '')

  const isPending = createMutation.isPending || updateMutation.isPending

  // Reset when dialog opens with new asset
  function resetForm(a: Asset | null) {
    setName(a?.name ?? '')
    setAssetCode(a?.asset_code ?? '')
    setCategoryId(String(a?.asset_category_id ?? 'none'))
    setSerialNumber(a?.serial_number ?? '')
    setBrand(a?.brand ?? '')
    setModel(a?.model ?? '')
    setPurchaseDate(a?.purchase_date ?? '')
    setPurchasePrice(a?.purchase_price ?? '')
    setWarrantyUntil(a?.warranty_until ?? '')
    setCondition(a?.condition ?? 'good')
    setNotes(a?.notes ?? '')
  }

  function handleOpenChange(o: boolean) {
    if (o) resetForm(asset)
    onOpenChange(o)
  }

  function handleSave() {
    const payload: Partial<Asset> = {
      name,
      asset_code: assetCode,
      asset_category_id: categoryId === 'none' ? null : parseInt(categoryId),
      serial_number: serialNumber || null,
      brand: brand || null,
      model: model || null,
      purchase_date: purchaseDate || null,
      purchase_price: purchasePrice || null,
      warranty_until: warrantyUntil || null,
      condition,
      notes: notes || null,
    }
    if (asset) {
      updateMutation.mutate({ id: asset.id, data: payload }, { onSuccess: () => onOpenChange(false) })
    } else {
      createMutation.mutate(payload, { onSuccess: () => { resetForm(null); onOpenChange(false) } })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{asset ? 'Edit Aset' : 'Tambah Aset'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="asset-name">Nama Aset *</Label>
              <Input id="asset-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Laptop Dell XPS" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="asset-code">Kode Aset *</Label>
              <Input id="asset-code" value={assetCode} onChange={(e) => setAssetCode(e.target.value)} placeholder="AST-001" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="asset-category">Kategori</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="asset-category">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa Kategori</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="asset-condition">Kondisi</Label>
              <Select value={condition} onValueChange={(v) => setCondition(v as AssetCondition)}>
                <SelectTrigger id="asset-condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Baik</SelectItem>
                  <SelectItem value="fair">Cukup</SelectItem>
                  <SelectItem value="poor">Buruk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="asset-brand">Merk</Label>
              <Input id="asset-brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Dell" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="asset-model">Model</Label>
              <Input id="asset-model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="XPS 15" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="asset-serial">Serial Number</Label>
            <Input id="asset-serial" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="SN123456789" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="asset-purchase-date">Tanggal Beli</Label>
              <Input id="asset-purchase-date" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="asset-price">Harga Beli (IDR)</Label>
              <Input id="asset-price" type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="15000000" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="asset-warranty">Garansi Hingga</Label>
            <Input id="asset-warranty" type="date" value={warrantyUntil} onChange={(e) => setWarrantyUntil(e.target.value)} />
            <p className="text-xs text-muted-foreground">Opsional — biarkan kosong jika tidak ada garansi</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="asset-notes">Catatan</Label>
            <Textarea id="asset-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Keterangan tambahan..." rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSave} disabled={isPending || !name || !assetCode}>
            {isPending ? 'Menyimpan…' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Assign Asset Dialog ──────────────────────────────────────────────────────
function AssignAssetDialog({
  asset,
  open,
  onOpenChange,
}: {
  asset: Asset | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: employeeData } = useEmployees({ per_page: 500, status: 'active' })
  const employees = employeeData?.data ?? []
  const assignMutation = useAssignAsset()

  const [employeeId, setEmployeeId]             = useState('')
  const [assignedDate, setAssignedDate]         = useState(new Date().toISOString().split('T')[0])
  const [conditionOnAssign, setConditionOnAssign] = useState<AssetCondition>('good')
  const [notes, setNotes]                       = useState('')

  function handleOpenChange(o: boolean) {
    if (o) {
      setEmployeeId('')
      setAssignedDate(new Date().toISOString().split('T')[0])
      setConditionOnAssign('good')
      setNotes('')
    }
    onOpenChange(o)
  }

  function handleAssign() {
    if (!asset || !employeeId) return
    assignMutation.mutate(
      {
        id: asset.id,
        data: {
          employee_id: parseInt(employeeId),
          assigned_date: assignedDate,
          condition_on_assign: conditionOnAssign,
          notes: notes || undefined,
        },
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pinjamkan Aset</DialogTitle>
        </DialogHeader>
        {asset && (
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p className="font-medium">{asset.name}</p>
              <p className="text-muted-foreground text-xs">{asset.asset_code}</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assign-employee">Karyawan *</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger id="assign-employee">
                  <SelectValue placeholder="Pilih karyawan..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.user.name} — {e.employee_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="assign-date">Tanggal Pinjam</Label>
                <Input id="assign-date" type="date" value={assignedDate} onChange={(e) => setAssignedDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="assign-condition">Kondisi Saat Pinjam</Label>
                <Select value={conditionOnAssign} onValueChange={(v) => setConditionOnAssign(v as AssetCondition)}>
                  <SelectTrigger id="assign-condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">Baik</SelectItem>
                    <SelectItem value="fair">Cukup</SelectItem>
                    <SelectItem value="poor">Buruk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assign-notes">Catatan</Label>
              <Textarea id="assign-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Keterangan..." rows={2} />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleAssign} disabled={assignMutation.isPending || !employeeId}>
            {assignMutation.isPending ? 'Memproses…' : 'Pinjamkan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Return Asset Dialog ──────────────────────────────────────────────────────
function ReturnAssetDialog({
  asset,
  open,
  onOpenChange,
}: {
  asset: Asset | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const returnMutation = useReturnAsset()

  const [returnedDate, setReturnedDate]           = useState(new Date().toISOString().split('T')[0])
  const [conditionOnReturn, setConditionOnReturn] = useState<AssetCondition>('good')
  const [notes, setNotes]                         = useState('')

  function handleOpenChange(o: boolean) {
    if (o) {
      setReturnedDate(new Date().toISOString().split('T')[0])
      setConditionOnReturn('good')
      setNotes('')
    }
    onOpenChange(o)
  }

  function handleReturn() {
    if (!asset) return
    returnMutation.mutate(
      {
        id: asset.id,
        data: {
          returned_date: returnedDate,
          condition_on_return: conditionOnReturn,
          notes: notes || undefined,
        },
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kembalikan Aset</DialogTitle>
        </DialogHeader>
        {asset && (
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p className="font-medium">{asset.name}</p>
              <p className="text-muted-foreground text-xs">{asset.asset_code}</p>
              {asset.current_assignment?.employee && (
                <p className="text-muted-foreground text-xs mt-1">
                  Dipinjam oleh: {asset.current_assignment.employee.user?.name}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="return-date">Tanggal Kembali</Label>
                <Input id="return-date" type="date" value={returnedDate} onChange={(e) => setReturnedDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="return-condition">Kondisi Saat Kembali</Label>
                <Select value={conditionOnReturn} onValueChange={(v) => setConditionOnReturn(v as AssetCondition)}>
                  <SelectTrigger id="return-condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">Baik</SelectItem>
                    <SelectItem value="fair">Cukup</SelectItem>
                    <SelectItem value="poor">Buruk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="return-notes">Catatan</Label>
              <Textarea id="return-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Keterangan..." rows={2} />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleReturn} disabled={returnMutation.isPending}>
            {returnMutation.isPending ? 'Memproses…' : 'Kembalikan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Delete Confirm Dialog ────────────────────────────────────────────────────
function DeleteConfirmDialog({
  asset,
  open,
  onOpenChange,
}: {
  asset: Asset | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const deleteMutation = useDeleteAsset()

  function handleDelete() {
    if (!asset) return
    deleteMutation.mutate(asset.id, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Hapus Aset</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <p className="text-sm text-muted-foreground">
            Apakah Anda yakin ingin menghapus aset{' '}
            <span className="font-medium text-foreground">{asset?.name}</span>?
            Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Menghapus…' : 'Hapus'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Dispose Confirm Dialog ───────────────────────────────────────────────────
function DisposeConfirmDialog({
  asset,
  open,
  onOpenChange,
}: {
  asset: Asset | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const disposeMutation = useDisposeAsset()
  const [notes, setNotes] = useState('')

  function handleOpenChange(o: boolean) {
    if (o) setNotes('')
    onOpenChange(o)
  }

  function handleDispose() {
    if (!asset) return
    disposeMutation.mutate(
      { id: asset.id, notes: notes || undefined },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArchiveX className="w-5 h-5 text-amber-600" />
            Buang Aset
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Aset <span className="font-medium text-foreground">{asset?.name}</span> akan
            ditandai sebagai <span className="font-medium text-amber-600">Dibuang</span>.
            Data riwayat peminjaman tetap tersimpan.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="dispose-notes">Alasan / Catatan</Label>
            <Textarea
              id="dispose-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Rusak parah, habis masa pakai, hilang..."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={handleDispose}
            disabled={disposeMutation.isPending}
          >
            {disposeMutation.isPending ? 'Memproses…' : 'Buang Aset'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Add/Edit Category Dialog ─────────────────────────────────────────────────
function AddEditCategoryDialog({
  category,
  open,
  onOpenChange,
}: {
  category: AssetCategory | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const createMutation = useCreateAssetCategory()
  const updateMutation = useUpdateAssetCategory()

  const [name, setName]               = useState(category?.name ?? '')
  const [code, setCode]               = useState(category?.code ?? '')
  const [description, setDescription] = useState(category?.description ?? '')
  const [isActive, setIsActive]       = useState(category?.is_active ?? true)

  const isPending = createMutation.isPending || updateMutation.isPending

  function handleOpenChange(o: boolean) {
    if (o) {
      setName(category?.name ?? '')
      setCode(category?.code ?? '')
      setDescription(category?.description ?? '')
      setIsActive(category?.is_active ?? true)
    }
    onOpenChange(o)
  }

  function handleSave() {
    const payload: Partial<AssetCategory> = { name, code, description: description || null, is_active: isActive }
    if (category) {
      updateMutation.mutate({ id: category.id, data: payload }, { onSuccess: () => onOpenChange(false) })
    } else {
      createMutation.mutate(payload, { onSuccess: () => onOpenChange(false) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{category ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Nama Kategori *</Label>
            <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Elektronik" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-code">Kode *</Label>
            <Input id="cat-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ELK" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-desc">Deskripsi</Label>
            <Textarea id="cat-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Keterangan kategori..." rows={2} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="cat-active">Aktif</Label>
            <Switch id="cat-active" checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSave} disabled={isPending || !name || !code}>
            {isPending ? 'Menyimpan…' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Delete Category Confirm ──────────────────────────────────────────────────
function DeleteCategoryConfirmDialog({
  category,
  open,
  onOpenChange,
}: {
  category: AssetCategory | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const deleteMutation = useDeleteAssetCategory()

  function handleDelete() {
    if (!category) return
    deleteMutation.mutate(category.id, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Hapus Kategori</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <p className="text-sm text-muted-foreground">
            Apakah Anda yakin ingin menghapus kategori{' '}
            <span className="font-medium text-foreground">{category?.name}</span>?
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Menghapus…' : 'Hapus'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Skeleton rows ────────────────────────────────────────────────────────────
function SkeletonRows({ cols, rows = 6 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: cols }).map((__, j) => (
            <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

// ── Tab: Daftar Aset ─────────────────────────────────────────────────────────
function AssetsTab() {
  const { data: categories = [] } = useAssetCategories()
  const [filters, setFilters]     = useState<AssetFilters>({ page: 1, per_page: 15 })
  const [search, setSearch]       = useState('')
  const { data, isLoading }       = useAssets(filters)

  const assets: Asset[] = data?.data ?? []
  const meta            = data?.meta

  const [addOpen, setAddOpen]           = useState(false)
  const [editTarget, setEditTarget]     = useState<Asset | null>(null)
  const [editOpen, setEditOpen]         = useState(false)
  const [assignTarget, setAssignTarget] = useState<Asset | null>(null)
  const [assignOpen, setAssignOpen]     = useState(false)
  const [returnTarget, setReturnTarget] = useState<Asset | null>(null)
  const [returnOpen, setReturnOpen]     = useState(false)
  const [disposeTarget, setDisposeTarget] = useState<Asset | null>(null)
  const [disposeOpen, setDisposeOpen]   = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null)
  const [deleteOpen, setDeleteOpen]     = useState(false)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setFilters((f) => ({ ...f, search: search || undefined, page: 1 }))
  }

  const handleExport = useCallback(() => {
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.category_id) params.set('category_id', String(filters.category_id))
    if (filters.search) params.set('search', filters.search)
    const token = localStorage.getItem(TOKEN_KEY)
    const url = `${API_BASE_URL}/assets/export?${params.toString()}`
    // Fetch with auth token then trigger download
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `laporan-aset-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(a.href)
      })
  }, [filters])

  function openEdit(asset: Asset) {
    setEditTarget(asset)
    setEditOpen(true)
  }

  function openAssign(asset: Asset) {
    setAssignTarget(asset)
    setAssignOpen(true)
  }

  function openReturn(asset: Asset) {
    setReturnTarget(asset)
    setReturnOpen(true)
  }

  function openDispose(asset: Asset) {
    setDisposeTarget(asset)
    setDisposeOpen(true)
  }

  function openDelete(asset: Asset) {
    setDeleteTarget(asset)
    setDeleteOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Cari aset..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48"
          />
          <Button type="submit" size="sm" variant="outline">
            <Search className="w-4 h-4" />
          </Button>
        </form>

        <Select
          value={(filters.status as string) ?? 'all'}
          onValueChange={(v) => setFilters((f) => ({ ...f, status: v === 'all' ? undefined : v, page: 1 }))}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="available">Tersedia</SelectItem>
            <SelectItem value="in_use">Dipakai</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="disposed">Dibuang</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={String(filters.category_id ?? 'all')}
          onValueChange={(v) => setFilters((f) => ({ ...f, category_id: v === 'all' ? undefined : v, page: 1 }))}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Tambah Aset
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-28">Kode</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Merk / Model</TableHead>
              <TableHead>Kondisi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dipinjam Oleh</TableHead>
              <TableHead className="w-28 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <SkeletonRows cols={8} />
            ) : assets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Belum ada aset.
                </TableCell>
              </TableRow>
            ) : (
              assets.map((a) => (
                <TableRow key={a.id} className="hover:bg-muted/30">
                  <TableCell>
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{a.asset_code}</span>
                  </TableCell>
                  <TableCell className="font-medium text-sm">{a.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.category?.name ?? '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {[a.brand, a.model].filter(Boolean).join(' ') || '—'}
                  </TableCell>
                  <TableCell><ConditionBadge condition={a.condition} /></TableCell>
                  <TableCell><StatusBadge status={a.status} /></TableCell>
                  <TableCell>
                    {a.current_assignment?.employee?.user?.name ? (
                      <div>
                        <p className="text-sm">{a.current_assignment.employee.user.name}</p>
                        {assignedByName(a.current_assignment) && (
                          <p className="text-xs text-muted-foreground">
                            dicatat: {assignedByName(a.current_assignment)}
                          </p>
                        )}
                      </div>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(a)} title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      {a.status === 'available' && (
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700" onClick={() => openAssign(a)} title="Pinjamkan">
                          <ArrowDownToLine className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {a.status === 'in_use' && (
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700" onClick={() => openReturn(a)} title="Kembalikan">
                          <ArrowUpFromLine className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {(a.status === 'available' || a.status === 'maintenance') && (
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700" onClick={() => openDispose(a)} title="Buang Aset">
                          <ArchiveX className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {a.status !== 'in_use' && (
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => openDelete(a)} title="Hapus Data">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
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
          <span>Total {meta.total} aset</span>
          <div className="flex gap-1">
            <Button
              size="sm" variant="outline"
              disabled={meta.current_page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
            >
              Sebelumnya
            </Button>
            <span className="px-3 py-1.5 text-xs">
              {meta.current_page} / {meta.last_page}
            </span>
            <Button
              size="sm" variant="outline"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AddEditAssetDialog asset={null} open={addOpen} onOpenChange={setAddOpen} />
      <AddEditAssetDialog asset={editTarget} open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditTarget(null) }} />
      <AssignAssetDialog asset={assignTarget} open={assignOpen} onOpenChange={(o) => { setAssignOpen(o); if (!o) setAssignTarget(null) }} />
      <ReturnAssetDialog asset={returnTarget} open={returnOpen} onOpenChange={(o) => { setReturnOpen(o); if (!o) setReturnTarget(null) }} />
      <DisposeConfirmDialog asset={disposeTarget} open={disposeOpen} onOpenChange={(o) => { setDisposeOpen(o); if (!o) setDisposeTarget(null) }} />
      <DeleteConfirmDialog asset={deleteTarget} open={deleteOpen} onOpenChange={(o) => { setDeleteOpen(o); if (!o) setDeleteTarget(null) }} />
    </div>
  )
}

// ── Tab: Peminjaman Aktif ────────────────────────────────────────────────────
function ActiveAssignmentsTab() {
  const { data, isLoading } = useAssets({ status: 'in_use', per_page: 100 })
  const assets: Asset[]     = data?.data ?? []

  const [returnTarget, setReturnTarget] = useState<Asset | null>(null)
  const [returnOpen, setReturnOpen]     = useState(false)

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Daftar aset yang sedang dipinjam oleh karyawan.
      </p>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Aset</TableHead>
              <TableHead>Karyawan</TableHead>
              <TableHead>Departemen</TableHead>
              <TableHead>Tgl Pinjam</TableHead>
              <TableHead>Kondisi Saat Pinjam</TableHead>
              <TableHead>Dicatat Oleh</TableHead>
              <TableHead className="w-24 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <SkeletonRows cols={7} />
            ) : assets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Tidak ada aset yang sedang dipinjam.
                </TableCell>
              </TableRow>
            ) : (
              assets.map((a) => {
                const asgn = a.current_assignment
                return (
                  <TableRow key={a.id} className="hover:bg-muted/30">
                    <TableCell>
                      <p className="font-medium text-sm">{a.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{a.asset_code}</p>
                    </TableCell>
                    <TableCell className="text-sm">{asgn?.employee?.user?.name ?? '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{asgn?.employee?.department?.name ?? '—'}</TableCell>
                    <TableCell className="text-sm">{asgn ? fmtDate(asgn.assigned_date) : '—'}</TableCell>
                    <TableCell>
                      {asgn ? <ConditionBadge condition={asgn.condition_on_assign} /> : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {asgn ? (assignedByName(asgn) ?? '—') : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm" variant="outline"
                        className="h-7 text-xs"
                        onClick={() => { setReturnTarget(a); setReturnOpen(true) }}
                      >
                        <ArrowUpFromLine className="w-3 h-3 mr-1" /> Kembalikan
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <ReturnAssetDialog
        asset={returnTarget}
        open={returnOpen}
        onOpenChange={(o) => { setReturnOpen(o); if (!o) setReturnTarget(null) }}
      />
    </div>
  )
}

// ── Tab: Kategori ────────────────────────────────────────────────────────────
function CategoriesTab() {
  const { data: categories = [], isLoading } = useAssetCategories()
  const updateMutation                        = useUpdateAssetCategory()

  const [addOpen, setAddOpen]             = useState(false)
  const [editTarget, setEditTarget]       = useState<AssetCategory | null>(null)
  const [editOpen, setEditOpen]           = useState(false)
  const [deleteTarget, setDeleteTarget]   = useState<AssetCategory | null>(null)
  const [deleteOpen, setDeleteOpen]       = useState(false)

  function toggleActive(cat: AssetCategory) {
    updateMutation.mutate({ id: cat.id, data: { is_active: !cat.is_active } })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Kelola kategori aset perusahaan.</p>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Tambah Kategori
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Nama</TableHead>
              <TableHead>Kode</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <SkeletonRows cols={5} />
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  Belum ada kategori.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow key={cat.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-sm">{cat.name}</TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 rounded bg-muted text-xs font-mono">{cat.code}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {cat.description ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={cat.is_active}
                      onCheckedChange={() => toggleActive(cat)}
                      disabled={updateMutation.isPending}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm" variant="ghost" className="h-7 w-7 p-0"
                        onClick={() => { setEditTarget(cat); setEditOpen(true) }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => { setDeleteTarget(cat); setDeleteOpen(true) }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AddEditCategoryDialog category={null} open={addOpen} onOpenChange={setAddOpen} />
      <AddEditCategoryDialog
        category={editTarget}
        open={editOpen}
        onOpenChange={(o) => { setEditOpen(o); if (!o) setEditTarget(null) }}
      />
      <DeleteCategoryConfirmDialog
        category={deleteTarget}
        open={deleteOpen}
        onOpenChange={(o) => { setDeleteOpen(o); if (!o) setDeleteTarget(null) }}
      />
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
type Tab = 'assets' | 'assignments' | 'categories'

export default function AdminAssetsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('assets')
  const { data: stats }           = useAssetStats()

  const TABS: { key: Tab; label: string }[] = [
    { key: 'assets',      label: 'Daftar Aset' },
    { key: 'assignments', label: 'Peminjaman Aktif' },
    { key: 'categories',  label: 'Kategori' },
  ]

  const statCards = [
    { label: 'Total Aset',    value: stats?.total ?? 0,       color: 'bg-slate-50 text-slate-700' },
    { label: 'Tersedia',      value: stats?.available ?? 0,   color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Sedang Dipakai', value: stats?.in_use ?? 0,     color: 'bg-blue-50 text-blue-700' },
    { label: 'Maintenance',   value: stats?.maintenance ?? 0, color: 'bg-amber-50 text-amber-700' },
  ]

  return (
    <DashboardLayout title="Manajemen Aset" allowedRoles={['admin', 'hr', 'director']}>
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statCards.map((c) => (
            <Card key={c.label}>
              <CardContent className={`p-4 text-center rounded-lg ${c.color}`}>
                <p className="text-2xl font-bold">{c.value}</p>
                <p className="text-xs font-medium">{c.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 border-b">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'assets'      && <AssetsTab />}
        {activeTab === 'assignments' && <ActiveAssignmentsTab />}
        {activeTab === 'categories'  && <CategoriesTab />}
      </div>
    </DashboardLayout>
  )
}
