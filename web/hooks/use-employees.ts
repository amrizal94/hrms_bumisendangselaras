'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createEmployee,
  deleteEmployee,
  fetchDepartments,
  fetchEmployees,
  toggleEmployeeActive,
  updateEmployee,
} from '@/lib/employee-api'
import type { CreateEmployeeData, EmployeeFilters, UpdateEmployeeData } from '@/types/employee'

export function useEmployees(filters: EmployeeFilters = {}) {
  return useQuery({
    queryKey: ['employees', filters],
    queryFn: () => fetchEmployees(filters),
  })
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => fetchDepartments({ is_active: true }),
    staleTime: 10 * 60 * 1000,
  })
}

export function useCreateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateEmployeeData) => createEmployee(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employee created successfully.')
    },
    onError: (err: unknown) => {
      const msg = getErrorMessage(err)
      toast.error(msg)
    },
  })
}

export function useUpdateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEmployeeData }) =>
      updateEmployee(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employee updated successfully.')
    },
    onError: (err: unknown) => {
      const msg = getErrorMessage(err)
      toast.error(msg)
    },
  })
}

export function useDeleteEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteEmployee(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employee deleted successfully.')
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useToggleEmployeeActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => toggleEmployeeActive(id),
    onSuccess: (emp) => {
      qc.invalidateQueries({ queryKey: ['employees'] })
      toast.success(emp.user.is_active ? 'Akun diaktifkan.' : 'Akun dinonaktifkan.')
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err))
    },
  })
}

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response
    if (res?.data?.errors) {
      return Object.values(res.data.errors).flat().join(', ')
    }
    if (res?.data?.message) return res.data.message
  }
  if (err instanceof Error) return err.message
  return 'An unexpected error occurred.'
}
