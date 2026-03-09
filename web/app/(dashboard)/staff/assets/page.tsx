'use client'

import { Package, Tag, Calendar, Wrench, CheckCircle2, AlertCircle } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useMyAssets } from '@/hooks/use-assets'
import type { Asset, AssetCondition, AssetStatus } from '@/types/asset'

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}

function fmtCurrency(val: string | null) {
  if (!val) return '-'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(val))
}

const STATUS_LABEL: Record<AssetStatus, string> = {
  available: 'Tersedia',
  in_use: 'Digunakan',
  maintenance: 'Perawatan',
  disposed: 'Dibuang',
}

const CONDITION_LABEL: Record<AssetCondition, string> = {
  good: 'Baik',
  fair: 'Cukup',
  poor: 'Buruk',
}

const CONDITION_COLOR: Record<AssetCondition, string> = {
  good: 'text-green-600 bg-green-50 border-green-200',
  fair: 'text-amber-600 bg-amber-50 border-amber-200',
  poor: 'text-red-600 bg-red-50 border-red-200',
}

// ── Asset Card ────────────────────────────────────────────────────────────────

function AssetCard({ asset }: { asset: Asset }) {
  const asgn = asset.current_assignment
  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">{asset.name}</p>
            <p className="text-xs text-muted-foreground">{asset.asset_code}</p>
          </div>
        </div>
        <span className={`shrink-0 text-xs font-medium border rounded-full px-2.5 py-0.5 ${CONDITION_COLOR[asset.condition]}`}>
          {CONDITION_LABEL[asset.condition]}
        </span>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {asset.category && (
          <>
            <span className="flex items-center gap-1.5"><Tag className="w-3 h-3" /> Kategori</span>
            <span className="text-foreground font-medium">{asset.category.name}</span>
          </>
        )}
        {asset.brand && (
          <>
            <span>Merek</span>
            <span className="text-foreground font-medium">{asset.brand}{asset.model ? ` — ${asset.model}` : ''}</span>
          </>
        )}
        {asset.serial_number && (
          <>
            <span>Serial</span>
            <span className="text-foreground font-medium font-mono">{asset.serial_number}</span>
          </>
        )}
        {asset.purchase_price && (
          <>
            <span>Nilai</span>
            <span className="text-foreground font-medium">{fmtCurrency(asset.purchase_price)}</span>
          </>
        )}
        {asset.warranty_until && (
          <>
            <span className="flex items-center gap-1.5"><Wrench className="w-3 h-3" /> Garansi s/d</span>
            <span className="text-foreground font-medium">{fmtDate(asset.warranty_until)}</span>
          </>
        )}
        {asgn && (
          <>
            <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Dipinjam sejak</span>
            <span className="text-foreground font-medium">{fmtDate(asgn.assigned_date)}</span>
          </>
        )}
      </div>

      {/* Notes */}
      {asset.notes && (
        <p className="text-xs text-muted-foreground border-t pt-2">{asset.notes}</p>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function StaffAssetsPage() {
  const { data, isLoading, isError } = useMyAssets()
  const assets: Asset[] = data ?? []

  return (
    <DashboardLayout title="Aset Saya" allowedRoles={['staff', 'hr', 'admin']}>
      <div className="space-y-6 max-w-2xl mx-auto">

        {/* Summary */}
        {!isLoading && !isError && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {assets.length > 0 ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>{assets.length} aset sedang dipinjamkan kepadamu</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Belum ada aset yang dipinjamkan kepadamu</span>
              </>
            )}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-xl border bg-muted/40 h-40 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Gagal memuat data aset. Coba muat ulang halaman.
          </div>
        )}

        {/* Asset list */}
        {!isLoading && !isError && assets.length > 0 && (
          <div className="space-y-4">
            {assets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && assets.length === 0 && (
          <div className="rounded-xl border bg-muted/30 p-10 flex flex-col items-center gap-3 text-muted-foreground">
            <Package className="w-12 h-12 opacity-30" />
            <p className="text-sm font-medium">Tidak ada aset</p>
            <p className="text-xs text-center">Aset yang dipinjamkan oleh perusahaan akan muncul di sini.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
