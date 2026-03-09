'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createHoliday,
  deleteHoliday,
  fetchHolidayDates,
  fetchHolidays,
  updateHoliday,
} from '@/lib/holiday-api'
import type { HolidayFormData } from '@/types/holiday'

export function useHolidays(year?: number) {
  return useQuery({
    queryKey: ['holidays', year],
    queryFn: () => fetchHolidays(year),
    staleTime: 10 * 60 * 1000,
  })
}

export function useHolidayDates(year?: number) {
  return useQuery({
    queryKey: ['holiday-dates', year],
    queryFn: () => fetchHolidayDates(year),
    staleTime: 10 * 60 * 1000,
  })
}

export function useCreateHoliday() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: HolidayFormData) => createHoliday(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['holidays'] })
      qc.invalidateQueries({ queryKey: ['holiday-dates'] })
      toast.success('Holiday added.')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateHoliday() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<HolidayFormData> }) => updateHoliday(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['holidays'] })
      qc.invalidateQueries({ queryKey: ['holiday-dates'] })
      toast.success('Holiday updated.')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteHoliday() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteHoliday(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['holidays'] })
      qc.invalidateQueries({ queryKey: ['holiday-dates'] })
      toast.success('Holiday deleted.')
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
