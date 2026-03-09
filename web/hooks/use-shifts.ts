'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createShift, deleteShift, fetchMyShift, fetchShifts, updateShift } from '@/lib/shift-api'
import type { CreateShiftData, ShiftFilters, UpdateShiftData } from '@/types/shift'

export function useMyShift() {
  return useQuery({
    queryKey: ['my-shift'],
    queryFn: fetchMyShift,
    staleTime: 5 * 60 * 1000,
  })
}

export function useShifts(filters: ShiftFilters = {}) {
  return useQuery({
    queryKey: ['shifts', filters],
    queryFn: () => fetchShifts(filters),
  })
}

export function useCreateShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateShiftData) => createShift(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shifts'] })
      toast.success('Shift created successfully.')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateShiftData }) => updateShift(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shifts'] })
      toast.success('Shift updated successfully.')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteShift(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shifts'] })
      toast.success('Shift deleted successfully.')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response
    if (res?.data?.errors) return Object.values(res.data.errors).flat().join(', ')
    if (res?.data?.message) return res.data.message
  }
  if (err instanceof Error) return err.message
  return 'An unexpected error occurred.'
}
