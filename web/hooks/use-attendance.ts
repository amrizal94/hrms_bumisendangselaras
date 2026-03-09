'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  checkIn,
  checkOut,
  createAttendance,
  deleteAttendance,
  fetchAttendance,
  fetchAttendanceSummary,
  fetchMyAttendance,
  fetchTodayAttendance,
  updateAttendance,
} from '@/lib/attendance-api'
import type { AttendanceFilters } from '@/types/attendance'

export function useAttendance(filters: AttendanceFilters = {}) {
  return useQuery({
    queryKey: ['attendance', filters],
    queryFn: () => fetchAttendance(filters),
  })
}

export function useAttendanceSummary(date?: string) {
  return useQuery({
    queryKey: ['attendance-summary', date],
    queryFn: () => fetchAttendanceSummary(date),
    refetchInterval: 60_000, // refresh every minute
  })
}

export function useTodayAttendance() {
  return useQuery({
    queryKey: ['attendance-today'],
    queryFn: fetchTodayAttendance,
    refetchInterval: 30_000,
  })
}

export function useMyAttendance(filters: AttendanceFilters = {}) {
  return useQuery({
    queryKey: ['my-attendance', filters],
    queryFn: () => fetchMyAttendance(filters),
  })
}

export function useCheckIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: checkIn,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['attendance-today'] })
      qc.invalidateQueries({ queryKey: ['my-attendance'] })
      qc.invalidateQueries({ queryKey: ['attendance-summary'] })
      toast.success(`Checked in at ${formatTime(data.check_in)}`)
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useCheckOut() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: checkOut,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['attendance-today'] })
      qc.invalidateQueries({ queryKey: ['my-attendance'] })
      qc.invalidateQueries({ queryKey: ['attendance-summary'] })
      toast.success(`Checked out at ${formatTime(data.check_out)}`)
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useCreateAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof createAttendance>[0]) => createAttendance(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] })
      qc.invalidateQueries({ queryKey: ['attendance-summary'] })
      toast.success('Attendance record added.')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateAttendance>[1] }) =>
      updateAttendance(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] })
      toast.success('Attendance updated.')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteAttendance(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] })
      qc.invalidateQueries({ queryKey: ['attendance-today'] })
      qc.invalidateQueries({ queryKey: ['attendance-summary'] })
      toast.success('Attendance record deleted.')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { message?: string } } }).response
    if (res?.data?.message) return res.data.message
  }
  if (err instanceof Error) return err.message
  return 'An unexpected error occurred.'
}
