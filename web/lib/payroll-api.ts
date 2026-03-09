import { api } from './api'
import type { EditPayrollData, PayrollFilters, PayrollRecord, PayrollSummary } from '@/types/payroll'
import type { PaginatedMeta } from '@/types/employee'

interface PaginatedPayroll {
  data: PayrollRecord[]
  meta: PaginatedMeta
}

export async function fetchPayrolls(filters: PayrollFilters = {}): Promise<PaginatedPayroll> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  )
  const res = await api.get('/payroll', { params })
  return res.data
}

export async function fetchPayrollSummary(year: number, month: number): Promise<PayrollSummary> {
  const res = await api.get('/payroll/summary', { params: { year, month } })
  return res.data.data
}

export async function generatePayroll(year: number, month: number): Promise<{ created: number; skipped: number }> {
  const res = await api.post('/payroll/generate', { year, month })
  return res.data.data
}

export async function finalizePayroll(id: number): Promise<PayrollRecord> {
  const res = await api.post(`/payroll/${id}/finalize`)
  return res.data.data
}

export async function markPayrollPaid(id: number): Promise<PayrollRecord> {
  const res = await api.post(`/payroll/${id}/mark-paid`)
  return res.data.data
}

export async function finalizeAllPayroll(year: number, month: number): Promise<void> {
  await api.post('/payroll/finalize-all', { year, month })
}

export async function markAllPayrollPaid(year: number, month: number): Promise<void> {
  await api.post('/payroll/mark-all-paid', { year, month })
}

export async function updatePayroll(id: number, data: EditPayrollData): Promise<PayrollRecord> {
  const res = await api.put(`/payroll/${id}`, data)
  return res.data.data
}

export async function deletePayroll(id: number): Promise<void> {
  await api.delete(`/payroll/${id}`)
}

export async function fetchMyPayslips(filters: PayrollFilters = {}): Promise<PaginatedPayroll> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  )
  const res = await api.get('/payroll/my', { params })
  return res.data
}
