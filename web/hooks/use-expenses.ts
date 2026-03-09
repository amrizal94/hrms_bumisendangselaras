'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  approveExpense,
  deleteExpense,
  fetchExpenses,
  fetchExpenseTypes,
  fetchMyExpenses,
  rejectExpense,
  submitExpense,
  updateExpenseType,
} from '@/lib/expense-api'
import type { ExpenseFilters } from '@/types/expense'

function getMsg(err: unknown): string {
  if (err instanceof Error) return err.message
  return 'An error occurred'
}

export function useMyExpenses(filters: ExpenseFilters = {}) {
  return useQuery({
    queryKey: ['my-expenses', filters],
    queryFn: () => fetchMyExpenses(filters),
  })
}

export function useSubmitExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => submitExpense(formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-expenses'] })
      toast.success('Expense submitted successfully.')
    },
    onError: (err: unknown) => toast.error(getMsg(err)),
  })
}

export function useDeleteExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteExpense(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-expenses'] })
      toast.success('Expense deleted.')
    },
    onError: (err: unknown) => toast.error(getMsg(err)),
  })
}

export function useExpenses(filters: ExpenseFilters = {}) {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => fetchExpenses(filters),
  })
}

export function useApproveExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => approveExpense(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('Expense approved.')
    },
    onError: (err: unknown) => toast.error(getMsg(err)),
  })
}

export function useRejectExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      rejectExpense(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('Expense rejected.')
    },
    onError: (err: unknown) => toast.error(getMsg(err)),
  })
}

export function useExpenseTypes(includeInactive = false) {
  return useQuery({
    queryKey: ['expense-types', includeInactive],
    queryFn: () => fetchExpenseTypes(includeInactive),
    staleTime: 10 * 60 * 1000,
  })
}

export function useUpdateExpenseType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateExpenseType>[1] }) =>
      updateExpenseType(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expense-types'] })
      toast.success('Expense type updated.')
    },
    onError: (err: unknown) => toast.error(getMsg(err)),
  })
}
