import { api } from './api'
import type {
  CreateBudgetProjectPayload,
  CreateFinanceAccountPayload,
  CreateFinanceCategoryPayload,
  CreateFinanceExpenditurePayload,
  CreateFinanceIncomePayload,
  FinanceAccount,
  FinanceAccountSummary,
  FinanceBudgetProject,
  FinanceCategory,
  FinanceDashboard,
  FinanceExpenditure,
  FinanceExpenditureFilters,
  FinanceIncome,
  FinanceIncomeFilters,
  BudgetProjectFilters,
  PaginatedResponse,
} from '@/types/finance'

function buildParams(filters: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  )
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export async function fetchFinanceDashboard(): Promise<FinanceDashboard> {
  const res = await api.get('/finance/dashboard')
  return res.data.data
}

// ── Accounts ─────────────────────────────────────────────────────────────────

export async function fetchFinanceAccounts(filters: Record<string, unknown> = {}): Promise<FinanceAccount[]> {
  const res = await api.get('/finance/accounts', { params: buildParams(filters) })
  return res.data.data
}

export async function fetchFinanceAccountSummary(): Promise<FinanceAccountSummary> {
  const res = await api.get('/finance/accounts/summary')
  return res.data.data
}

export async function createFinanceAccount(payload: CreateFinanceAccountPayload): Promise<FinanceAccount> {
  const res = await api.post('/finance/accounts', payload)
  return res.data.data
}

export async function updateFinanceAccount(id: number, payload: Partial<CreateFinanceAccountPayload>): Promise<FinanceAccount> {
  const res = await api.put(`/finance/accounts/${id}`, payload)
  return res.data.data
}

export async function deleteFinanceAccount(id: number): Promise<void> {
  await api.delete(`/finance/accounts/${id}`)
}

// ── Categories ───────────────────────────────────────────────────────────────

export async function fetchFinanceCategories(filters: Record<string, unknown> = {}): Promise<FinanceCategory[]> {
  const res = await api.get('/finance/categories', { params: buildParams(filters) })
  return res.data.data
}

export async function createFinanceCategory(payload: CreateFinanceCategoryPayload): Promise<FinanceCategory> {
  const res = await api.post('/finance/categories', payload)
  return res.data.data
}

export async function updateFinanceCategory(id: number, payload: Partial<CreateFinanceCategoryPayload>): Promise<FinanceCategory> {
  const res = await api.put(`/finance/categories/${id}`, payload)
  return res.data.data
}

export async function deleteFinanceCategory(id: number): Promise<void> {
  await api.delete(`/finance/categories/${id}`)
}

// ── Incomes ──────────────────────────────────────────────────────────────────

export async function fetchFinanceIncomes(filters: FinanceIncomeFilters = {}): Promise<PaginatedResponse<FinanceIncome>> {
  const res = await api.get('/finance/incomes', { params: buildParams(filters as Record<string, unknown>) })
  return res.data
}

export async function fetchFinanceIncome(id: number): Promise<FinanceIncome> {
  const res = await api.get(`/finance/incomes/${id}`)
  return res.data.data
}

export async function createFinanceIncome(payload: CreateFinanceIncomePayload): Promise<FinanceIncome> {
  const res = await api.post('/finance/incomes', payload)
  return res.data.data
}

export async function updateFinanceIncome(id: number, payload: Partial<CreateFinanceIncomePayload>): Promise<FinanceIncome> {
  const res = await api.put(`/finance/incomes/${id}`, payload)
  return res.data.data
}

export async function deleteFinanceIncome(id: number): Promise<void> {
  await api.delete(`/finance/incomes/${id}`)
}

export async function approveFinanceIncome(id: number): Promise<FinanceIncome> {
  const res = await api.post(`/finance/incomes/${id}/approve`)
  return res.data.data
}

export async function rejectFinanceIncome(id: number, rejection_note: string): Promise<FinanceIncome> {
  const res = await api.post(`/finance/incomes/${id}/reject`, { rejection_note })
  return res.data.data
}

// ── Budget Projects ───────────────────────────────────────────────────────────

export async function fetchFinanceBudgetProjects(filters: BudgetProjectFilters = {}): Promise<PaginatedResponse<FinanceBudgetProject>> {
  const res = await api.get('/finance/budget-projects', { params: buildParams(filters as Record<string, unknown>) })
  return res.data
}

export async function fetchFinanceBudgetProject(id: number): Promise<FinanceBudgetProject> {
  const res = await api.get(`/finance/budget-projects/${id}`)
  return res.data.data
}

export async function createFinanceBudgetProject(payload: CreateBudgetProjectPayload): Promise<FinanceBudgetProject> {
  const res = await api.post('/finance/budget-projects', payload)
  return res.data.data
}

export async function updateFinanceBudgetProject(id: number, payload: Partial<CreateBudgetProjectPayload>): Promise<FinanceBudgetProject> {
  const res = await api.put(`/finance/budget-projects/${id}`, payload)
  return res.data.data
}

export async function deleteFinanceBudgetProject(id: number): Promise<void> {
  await api.delete(`/finance/budget-projects/${id}`)
}

export async function completeFinanceBudgetProject(id: number): Promise<FinanceBudgetProject> {
  const res = await api.post(`/finance/budget-projects/${id}/complete`)
  return res.data.data
}

// ── Expenditures ──────────────────────────────────────────────────────────────

export async function fetchFinanceExpenditures(filters: FinanceExpenditureFilters = {}): Promise<PaginatedResponse<FinanceExpenditure>> {
  const res = await api.get('/finance/expenditures', { params: buildParams(filters as Record<string, unknown>) })
  return res.data
}

export async function fetchFinanceExpenditure(id: number): Promise<FinanceExpenditure> {
  const res = await api.get(`/finance/expenditures/${id}`)
  return res.data.data
}

export async function createFinanceExpenditure(payload: CreateFinanceExpenditurePayload): Promise<FinanceExpenditure> {
  const res = await api.post('/finance/expenditures', payload)
  return res.data.data
}

export async function updateFinanceExpenditure(id: number, payload: Partial<CreateFinanceExpenditurePayload>): Promise<FinanceExpenditure> {
  const res = await api.put(`/finance/expenditures/${id}`, payload)
  return res.data.data
}

export async function deleteFinanceExpenditure(id: number): Promise<void> {
  await api.delete(`/finance/expenditures/${id}`)
}

export async function approveFinanceExpenditure(id: number): Promise<FinanceExpenditure> {
  const res = await api.post(`/finance/expenditures/${id}/approve`)
  return res.data.data
}

export async function rejectFinanceExpenditure(id: number, rejection_note: string): Promise<FinanceExpenditure> {
  const res = await api.post(`/finance/expenditures/${id}/reject`, { rejection_note })
  return res.data.data
}
