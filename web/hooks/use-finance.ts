'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  approveFinanceExpenditure,
  approveFinanceIncome,
  completeFinanceBudgetProject,
  createFinanceAccount,
  createFinanceBudgetProject,
  createFinanceCategory,
  createFinanceExpenditure,
  createFinanceIncome,
  deleteFinanceAccount,
  deleteFinanceBudgetProject,
  deleteFinanceCategory,
  deleteFinanceExpenditure,
  deleteFinanceIncome,
  fetchFinanceAccountSummary,
  fetchFinanceAccounts,
  fetchFinanceBudgetProjects,
  fetchFinanceCategories,
  fetchFinanceDashboard,
  fetchFinanceExpenditures,
  fetchFinanceIncomes,
  rejectFinanceExpenditure,
  rejectFinanceIncome,
  updateFinanceAccount,
  updateFinanceBudgetProject,
  updateFinanceCategory,
  updateFinanceExpenditure,
  updateFinanceIncome,
} from '@/lib/finance-api'
import type {
  BudgetProjectFilters,
  CreateBudgetProjectPayload,
  CreateFinanceAccountPayload,
  CreateFinanceCategoryPayload,
  CreateFinanceExpenditurePayload,
  CreateFinanceIncomePayload,
  FinanceExpenditureFilters,
  FinanceIncomeFilters,
} from '@/types/finance'

function getMsg(err: unknown): string {
  if (err instanceof Error) return err.message
  return 'An error occurred'
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export function useFinanceDashboard() {
  return useQuery({
    queryKey: ['finance-dashboard'],
    queryFn: fetchFinanceDashboard,
    staleTime: 2 * 60 * 1000,
  })
}

// ── Accounts ─────────────────────────────────────────────────────────────────

export function useFinanceAccounts(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['finance-accounts', filters],
    queryFn: () => fetchFinanceAccounts(filters),
    staleTime: 5 * 60 * 1000,
  })
}

export function useFinanceAccountSummary() {
  return useQuery({
    queryKey: ['finance-account-summary'],
    queryFn: fetchFinanceAccountSummary,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateFinanceAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateFinanceAccountPayload) => createFinanceAccount(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-accounts'] })
      qc.invalidateQueries({ queryKey: ['finance-account-summary'] })
      qc.invalidateQueries({ queryKey: ['finance-dashboard'] })
      toast.success('Rekening berhasil dibuat.')
    },
    onError: (err: unknown) => toast.error(getMsg(err)),
  })
}

export function useUpdateFinanceAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateFinanceAccountPayload> }) =>
      updateFinanceAccount(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-accounts'] })
      qc.invalidateQueries({ queryKey: ['finance-account-summary'] })
      toast.success('Rekening berhasil diperbarui.')
    },
    onError: (err: unknown) => toast.error(getMsg(err)),
  })
}

export function useDeleteFinanceAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteFinanceAccount(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-accounts'] })
      qc.invalidateQueries({ queryKey: ['finance-account-summary'] })
      qc.invalidateQueries({ queryKey: ['finance-dashboard'] })
      toast.success('Rekening dihapus.')
    },
    onError: (err: unknown) => toast.error(getMsg(err)),
  })
}

// ── Categories ───────────────────────────────────────────────────────────────

export function useFinanceCategories(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['finance-categories', filters],
    queryFn: () => fetchFinanceCategories(filters),
    staleTime: 10 * 60 * 1000,
  })
}

export function useCreateFinanceCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateFinanceCategoryPayload) => createFinanceCategory(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-categories'] })
      toast.success('Kategori berhasil dibuat.')
    },
    onError: (err: unknown) => toast.error(getMsg(err)),
  })
}

export function useUpdateFinanceCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateFinanceCategoryPayload> }) =>
      updateFinanceCategory(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-categories'] })
      toast.success('Kategori diperbarui.')
    },
    onError: (err: unknown) => toast.error(getMsg(err)),
  })
}

export function useDeleteFinanceCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteFinanceCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-categories'] })
      toast.success('Kategori dihapus.')
    },
    onError: (err: unknown) => toast.error(getMsg(err)),
  })
}

// ── Incomes ──────────────────────────────────────────────────────────────────

export function useFinanceIncomes(filters: FinanceIncomeFilters = {}) {
  return useQuery({
    queryKey: ['finance-incomes', filters],
    queryFn: () => fetchFinanceIncomes(filters),
  })
}

export function useCreateFinanceIncome() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateFinanceIncomePayload) => createFinanceIncome(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-incomes'] })
      qc.invalidateQueries({ queryKey: ['finance-accounts'] })
      qc.invalidateQueries({ queryKey: ['finance-dashboard'] })
      toast.success('Pemasukan berhasil ditambahkan.')
    },
    onError: (err: unknown) => toast.error(getMsg(err)),
  })
}

export function useUpdateFinanceIncome() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateFinanceIncomePayload> }) =>
      updateFinanceIncome(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-incomes'] })
      toast.success('Pemasukan diperbarui.')
    },
    onError: (err: unknown) => toast.error(getMsg(err)),
  })
}

export function useDeleteFinanceIncome() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteFinanceIncome(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-incomes'] })
      qc.invalidateQueries({ queryKey: ['finance-accounts'] })
      qc.invalidateQueries({ queryKey: ['finance-dashboard'] })
      toast.success('Pemasukan dihapus.')
    },
    onError: (err: unknown) => toast.error(getMsg(err)),
  })
}

export function useApproveFinanceIncome() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => approveFinanceIncome(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-incomes'] })
      qc.invalidateQueries({ queryKey: ['finance-accounts'] })
      qc.invalidateQueries({ queryKey: ['finance-dashboard'] })
      toast.success('Pemasukan disetujui.')
    },
    onError: (err: unknown) => toast.error(getMsg(err)),
  })
}

export function useRejectFinanceIncome() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) => rejectFinanceIncome(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-incomes'] })
      toast.success('Pemasukan ditolak.')
    },
    onError: (err: unknown) => toast.error(getMsg(err)),
  })
}

// ── Budget Projects ───────────────────────────────────────────────────────────

export function useFinanceBudgetProjects(filters: BudgetProjectFilters = {}) {
  return useQuery({
    queryKey: ['finance-budget-projects', filters],
    queryFn: () => fetchFinanceBudgetProjects(filters),
  })
}

export function useCreateFinanceBudgetProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateBudgetProjectPayload) => createFinanceBudgetProject(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-budget-projects'] })
      qc.invalidateQueries({ queryKey: ['finance-dashboard'] })
      toast.success('Budget proyek berhasil dibuat.')
    },
    onError: (err: unknown) => toast.error(getMsg(err)),
  })
}

export function useUpdateFinanceBudgetProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateBudgetProjectPayload> }) =>
      updateFinanceBudgetProject(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-budget-projects'] })
      toast.success('Budget proyek diperbarui.')
    },
    onError: (err: unknown) => toast.error(getMsg(err)),
  })
}

export function useDeleteFinanceBudgetProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteFinanceBudgetProject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-budget-projects'] })
      qc.invalidateQueries({ queryKey: ['finance-dashboard'] })
      toast.success('Budget proyek dihapus.')
    },
    onError: (err: unknown) => toast.error(getMsg(err)),
  })
}

export function useCompleteFinanceBudgetProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => completeFinanceBudgetProject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-budget-projects'] })
      qc.invalidateQueries({ queryKey: ['finance-dashboard'] })
      toast.success('Proyek ditandai selesai.')
    },
    onError: (err: unknown) => toast.error(getMsg(err)),
  })
}

// ── Expenditures ──────────────────────────────────────────────────────────────

export function useFinanceExpenditures(filters: FinanceExpenditureFilters = {}) {
  return useQuery({
    queryKey: ['finance-expenditures', filters],
    queryFn: () => fetchFinanceExpenditures(filters),
  })
}

export function useCreateFinanceExpenditure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateFinanceExpenditurePayload) => createFinanceExpenditure(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-expenditures'] })
      qc.invalidateQueries({ queryKey: ['finance-dashboard'] })
      toast.success('Pengeluaran berhasil ditambahkan.')
    },
    onError: (err: unknown) => toast.error(getMsg(err)),
  })
}

export function useUpdateFinanceExpenditure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateFinanceExpenditurePayload> }) =>
      updateFinanceExpenditure(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-expenditures'] })
      toast.success('Pengeluaran diperbarui.')
    },
    onError: (err: unknown) => toast.error(getMsg(err)),
  })
}

export function useDeleteFinanceExpenditure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteFinanceExpenditure(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-expenditures'] })
      qc.invalidateQueries({ queryKey: ['finance-accounts'] })
      qc.invalidateQueries({ queryKey: ['finance-budget-projects'] })
      qc.invalidateQueries({ queryKey: ['finance-dashboard'] })
      toast.success('Pengeluaran dihapus.')
    },
    onError: (err: unknown) => toast.error(getMsg(err)),
  })
}

export function useApproveFinanceExpenditure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => approveFinanceExpenditure(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-expenditures'] })
      qc.invalidateQueries({ queryKey: ['finance-accounts'] })
      qc.invalidateQueries({ queryKey: ['finance-budget-projects'] })
      qc.invalidateQueries({ queryKey: ['finance-dashboard'] })
      toast.success('Pengeluaran disetujui.')
    },
    onError: (err: unknown) => toast.error(getMsg(err)),
  })
}

export function useRejectFinanceExpenditure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) => rejectFinanceExpenditure(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-expenditures'] })
      toast.success('Pengeluaran ditolak.')
    },
    onError: (err: unknown) => toast.error(getMsg(err)),
  })
}
