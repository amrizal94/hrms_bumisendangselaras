'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  deletePayroll,
  fetchMyPayslips,
  fetchPayrolls,
  fetchPayrollSummary,
  finalizeAllPayroll,
  finalizePayroll,
  generatePayroll,
  markAllPayrollPaid,
  markPayrollPaid,
  updatePayroll,
} from '@/lib/payroll-api'
import type { EditPayrollData, PayrollFilters } from '@/types/payroll'

export function usePayrolls(filters: PayrollFilters = {}) {
  return useQuery({
    queryKey: ['payrolls', filters],
    queryFn: () => fetchPayrolls(filters),
  })
}

export function usePayrollSummary(year: number, month: number) {
  return useQuery({
    queryKey: ['payroll-summary', year, month],
    queryFn: () => fetchPayrollSummary(year, month),
    enabled: !!year && !!month,
  })
}

export function useMyPayslips(filters: PayrollFilters = {}) {
  return useQuery({
    queryKey: ['my-payslips', filters],
    queryFn: () => fetchMyPayslips(filters),
  })
}

export function useGeneratePayroll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) => generatePayroll(year, month),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['payrolls'] })
      qc.invalidateQueries({ queryKey: ['payroll-summary'] })
      toast.success(`Generated ${data.created} record(s). Skipped ${data.skipped} existing.`)
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useFinalizePayroll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => finalizePayroll(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payrolls'] })
      qc.invalidateQueries({ queryKey: ['payroll-summary'] })
      toast.success('Payroll finalized.')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useMarkPayrollPaid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => markPayrollPaid(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payrolls'] })
      qc.invalidateQueries({ queryKey: ['payroll-summary'] })
      toast.success('Payroll marked as paid.')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useFinalizeAll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) => finalizeAllPayroll(year, month),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payrolls'] })
      qc.invalidateQueries({ queryKey: ['payroll-summary'] })
      toast.success('All draft payrolls finalized.')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useMarkAllPaid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) => markAllPayrollPaid(year, month),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payrolls'] })
      qc.invalidateQueries({ queryKey: ['payroll-summary'] })
      toast.success('All finalized payrolls marked as paid.')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdatePayroll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EditPayrollData }) => updatePayroll(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payrolls'] })
      toast.success('Payroll updated.')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useDeletePayroll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deletePayroll(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payrolls'] })
      toast.success('Payroll record deleted.')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { message?: string } } }).response
    if (res?.data?.message) return res.data.message
  }
  if (err instanceof Error) return err.message
  return 'An unexpected error occurred.'
}
