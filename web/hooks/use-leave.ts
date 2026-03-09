'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  applyLeave,
  approveLeave,
  cancelLeave,
  fetchLeaveQuota,
  fetchLeaves,
  fetchLeaveTypes,
  fetchMyLeaves,
  rejectLeave,
  updateLeaveType,
} from '@/lib/leave-api'
import type { ApplyLeaveData, LeaveFilters } from '@/types/leave'

export function useLeaveTypes() {
  return useQuery({
    queryKey: ['leave-types'],
    queryFn: fetchLeaveTypes,
    staleTime: 10 * 60 * 1000,
  })
}

export function useLeaves(filters: LeaveFilters = {}) {
  return useQuery({
    queryKey: ['leaves', filters],
    queryFn: () => fetchLeaves(filters),
  })
}

export function useMyLeaves(filters: LeaveFilters = {}) {
  return useQuery({
    queryKey: ['my-leaves', filters],
    queryFn: () => fetchMyLeaves(filters),
  })
}

export function useLeaveQuota() {
  return useQuery({
    queryKey: ['leave-quota'],
    queryFn: fetchLeaveQuota,
  })
}

export function useApplyLeave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ApplyLeaveData) => applyLeave(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-leaves'] })
      qc.invalidateQueries({ queryKey: ['leave-quota'] })
      toast.success('Leave request submitted successfully.')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useCancelLeave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => cancelLeave(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-leaves'] })
      qc.invalidateQueries({ queryKey: ['leave-quota'] })
      toast.success('Leave request cancelled.')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useApproveLeave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => approveLeave(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaves'] })
      toast.success('Leave request approved.')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useRejectLeave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectLeave(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaves'] })
      toast.success('Leave request rejected.')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateLeaveType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { max_days_per_year: number; is_active: boolean } }) =>
      updateLeaveType(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave-types'] })
      toast.success('Leave type updated.')
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
