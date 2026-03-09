'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  approveOvertime,
  cancelOvertime,
  fetchMyOvertimes,
  fetchOvertimes,
  fetchOvertimeSummary,
  rejectOvertime,
  submitOvertime,
} from '@/lib/overtime-api'
import type { OvertimeFilters, SubmitOvertimeData } from '@/types/overtime'

export function useOvertimes(filters: OvertimeFilters = {}) {
  return useQuery({
    queryKey: ['overtimes', filters],
    queryFn: () => fetchOvertimes(filters),
  })
}

export function useMyOvertimes(filters: OvertimeFilters = {}) {
  return useQuery({
    queryKey: ['my-overtimes', filters],
    queryFn: () => fetchMyOvertimes(filters),
  })
}

export function useOvertimeSummary() {
  return useQuery({
    queryKey: ['overtime-summary'],
    queryFn: fetchOvertimeSummary,
  })
}

export function useSubmitOvertime() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SubmitOvertimeData) => submitOvertime(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-overtimes'] })
      qc.invalidateQueries({ queryKey: ['overtime-summary'] })
      toast.success('Overtime request submitted successfully.')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useCancelOvertime() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => cancelOvertime(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-overtimes'] })
      qc.invalidateQueries({ queryKey: ['overtime-summary'] })
      toast.success('Overtime request cancelled.')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useApproveOvertime() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => approveOvertime(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['overtimes'] })
      qc.invalidateQueries({ queryKey: ['overtime-summary'] })
      toast.success('Overtime request approved.')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useRejectOvertime() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectOvertime(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['overtimes'] })
      qc.invalidateQueries({ queryKey: ['overtime-summary'] })
      toast.success('Overtime request rejected.')
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
