import { api } from './api'
import type { Expense, ExpenseFilters, ExpenseMeta, ExpenseType } from '@/types/expense'

interface PaginatedExpenses {
  data: Expense[]
  meta: ExpenseMeta
}

function buildParams(filters: ExpenseFilters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  )
}

export async function fetchMyExpenses(filters: ExpenseFilters = {}): Promise<PaginatedExpenses> {
  const res = await api.get('/expenses/my', { params: buildParams(filters) })
  return res.data
}

export async function submitExpense(formData: FormData): Promise<Expense> {
  const res = await api.post('/expenses', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.data
}

export async function deleteExpense(id: number): Promise<void> {
  await api.delete(`/expenses/${id}`)
}

export async function fetchExpenses(filters: ExpenseFilters = {}): Promise<PaginatedExpenses> {
  const res = await api.get('/expenses', { params: buildParams(filters) })
  return res.data
}

export async function approveExpense(id: number): Promise<Expense> {
  const res = await api.post(`/expenses/${id}/approve`)
  return res.data.data
}

export async function rejectExpense(id: number, rejection_reason: string): Promise<Expense> {
  const res = await api.post(`/expenses/${id}/reject`, { rejection_reason })
  return res.data.data
}

export async function fetchExpenseTypes(includeInactive = false): Promise<ExpenseType[]> {
  const res = await api.get('/expense-types', { params: includeInactive ? { include_inactive: 1 } : {} })
  return res.data.data
}

export async function updateExpenseType(id: number, data: Partial<Pick<ExpenseType, 'name' | 'code' | 'description' | 'is_active'>>): Promise<ExpenseType> {
  const res = await api.put(`/expense-types/${id}`, data)
  return res.data.data
}
