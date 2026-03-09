'use client'

import Link from 'next/link'
import { TrendingUp, TrendingDown, Wallet, FolderKanban, Clock, ArrowRight, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useFinanceDashboard } from '@/hooks/use-finance'
import type { RecentTransactionItem } from '@/types/finance'

function fmtCurrency(v: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v)
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending:  { label: 'Pending',  className: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Disetujui', className: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Ditolak',  className: 'bg-red-100 text-red-700' },
}

const PROJECT_STATUS_STYLES: Record<string, string> = {
  planning:  'bg-blue-100 text-blue-700',
  active:    'bg-emerald-100 text-emerald-700',
  completed: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-red-100 text-red-700',
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  href,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
  href?: string
}) {
  const content = (
    <CardContent className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </CardContent>
  )

  if (href) {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <Link href={href}>{content}</Link>
      </Card>
    )
  }

  return <Card>{content}</Card>
}

function TransactionRow({ tx }: { tx: RecentTransactionItem }) {
  const st = STATUS_STYLES[tx.status] ?? STATUS_STYLES.pending
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          tx.type === 'income' ? 'bg-emerald-100' : 'bg-red-100'
        }`}>
          {tx.type === 'income'
            ? <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            : <ArrowDownRight className="w-4 h-4 text-red-600" />
          }
        </div>
        <div>
          <p className="text-sm font-medium truncate max-w-[200px]">{tx.label}</p>
          <p className="text-xs text-muted-foreground">{fmtDate(tx.date)} · {tx.account?.name}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-semibold ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
          {tx.type === 'income' ? '+' : '-'}{fmtCurrency(tx.amount)}
        </p>
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${st.className}`}>
          {st.label}
        </span>
      </div>
    </div>
  )
}

export default function FinanceDashboardPage() {
  const { data, isLoading } = useFinanceDashboard()

  return (
    <DashboardLayout title="Keuangan" allowedRoles={['admin', 'director']}>
      <div className="space-y-6">

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Saldo"
            value={isLoading ? '...' : fmtCurrency(data?.total_balance ?? 0)}
            icon={Wallet}
            color="bg-blue-100 text-blue-600"
            href="/admin/finance/accounts"
          />
          <StatCard
            label="Pemasukan Bulan Ini"
            value={isLoading ? '...' : fmtCurrency(data?.total_income_this_month ?? 0)}
            icon={TrendingUp}
            color="bg-emerald-100 text-emerald-600"
            href="/admin/finance/incomes"
          />
          <StatCard
            label="Pengeluaran Bulan Ini"
            value={isLoading ? '...' : fmtCurrency(data?.total_expenditure_this_month ?? 0)}
            icon={TrendingDown}
            color="bg-red-100 text-red-600"
            href="/admin/finance/expenditures"
          />
          <StatCard
            label="Proyek Aktif"
            value={isLoading ? '...' : (data?.active_projects_count ?? 0)}
            icon={FolderKanban}
            color="bg-purple-100 text-purple-600"
            href="/admin/finance/budget-projects"
          />
        </div>

        {/* Pending badge */}
        {(data?.pending_expenditures_count ?? 0) > 0 && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-700">
              Ada <span className="font-semibold">{data?.pending_expenditures_count}</span> pengeluaran menunggu persetujuan.
            </p>
            <Link href="/admin/finance/expenditures" className="ml-auto text-xs text-amber-700 underline font-medium">
              Lihat
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Summary Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ringkasan 6 Bulan Terakhir</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-2 font-medium">Bulan</th>
                      <th className="text-right px-4 py-2 font-medium text-emerald-600">Pemasukan</th>
                      <th className="text-right px-4 py-2 font-medium text-red-600">Pengeluaran</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading
                      ? Array.from({ length: 6 }).map((_, i) => (
                          <tr key={i} className="border-b">
                            {Array.from({ length: 3 }).map((__, j) => (
                              <td key={j} className="px-4 py-2">
                                <div className="h-4 bg-muted animate-pulse rounded" />
                              </td>
                            ))}
                          </tr>
                        ))
                      : (data?.monthly_summary ?? []).map((m) => (
                          <tr key={m.month} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="px-4 py-2 font-medium">{m.month_label}</td>
                            <td className="px-4 py-2 text-right text-emerald-600">{fmtCurrency(m.income)}</td>
                            <td className="px-4 py-2 text-right text-red-600">{fmtCurrency(m.expenditure)}</td>
                          </tr>
                        ))
                    }
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Transaksi Terbaru</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : (data?.recent_transactions ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Belum ada transaksi.</p>
              ) : (
                (data?.recent_transactions ?? []).map((tx) => (
                  <TransactionRow key={`${tx.type}-${tx.id}`} tx={tx} />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Budget Projects */}
        {(data?.top_projects ?? []).length > 0 && (
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Top Budget Proyek</CardTitle>
              <Link href="/admin/finance/budget-projects" className="text-xs text-primary flex items-center gap-1 hover:underline">
                Lihat semua <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(data?.top_projects ?? []).map((p) => (
                  <div key={p.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="text-sm font-medium">{p.name}</span>
                        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-medium ${PROJECT_STATUS_STYLES[p.status] ?? ''}`}>
                          {p.status}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {fmtCurrency(p.spent_amount)} / {fmtCurrency(p.total_budget)}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${p.usage_percent >= 90 ? 'bg-red-500' : p.usage_percent >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(p.usage_percent, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {p.usage_percent.toFixed(1)}% terpakai · Sisa {fmtCurrency(p.remaining_budget)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Rekening',      href: '/admin/finance/accounts',        color: 'border-blue-200 bg-blue-50 text-blue-700' },
            { label: 'Pemasukan',     href: '/admin/finance/incomes',         color: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
            { label: 'Budget Proyek', href: '/admin/finance/budget-projects', color: 'border-purple-200 bg-purple-50 text-purple-700' },
            { label: 'Pengeluaran',   href: '/admin/finance/expenditures',    color: 'border-red-200 bg-red-50 text-red-700' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium transition-opacity hover:opacity-80 ${item.color}`}
            >
              {item.label}
              <ArrowRight className="w-4 h-4" />
            </Link>
          ))}
        </div>

      </div>
    </DashboardLayout>
  )
}
