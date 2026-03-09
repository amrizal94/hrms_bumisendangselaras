'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  fetchMeetings,
  fetchMyMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  rsvpMeeting,
  fetchMeetingRsvps,
} from '@/lib/meeting-api'
import type { CreateMeetingData } from '@/types/meeting'

export function useMeetings() {
  return useQuery({
    queryKey: ['meetings'],
    queryFn: fetchMeetings,
    staleTime: 2 * 60 * 1000,
  })
}

export function useMyMeetings() {
  return useQuery({
    queryKey: ['meetings', 'my'],
    queryFn: fetchMyMeetings,
    staleTime: 2 * 60 * 1000,
  })
}

export function useMeetingRsvps(id: number) {
  return useQuery({
    queryKey: ['meetings', id, 'rsvps'],
    queryFn: () => fetchMeetingRsvps(id),
    enabled: id > 0,
  })
}

export function useCreateMeeting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateMeetingData) => createMeeting(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] })
      toast.success('Meeting created and notifications sent.')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateMeeting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateMeetingData> }) =>
      updateMeeting(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] })
      toast.success('Meeting updated.')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteMeeting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteMeeting(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] })
      toast.success('Meeting deleted.')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useRsvpMeeting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'accepted' | 'declined' }) =>
      rsvpMeeting(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] })
      toast.success('RSVP submitted.')
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
