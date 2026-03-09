'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createAnnouncement,
  deleteAnnouncement,
  fetchAnnouncements,
  updateAnnouncement,
} from '@/lib/announcement-api'
import type { CreateAnnouncementData } from '@/types/announcement'

export function useAnnouncements(filters?: { category?: string; limit?: number }) {
  return useQuery({
    queryKey: ['announcements', filters],
    queryFn: () => fetchAnnouncements(filters),
    staleTime: 2 * 60 * 1000,
  })
}

export function useCreateAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateAnnouncementData) => createAnnouncement(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] })
      toast.success('Announcement sent.')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateAnnouncementData> }) =>
      updateAnnouncement(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] })
      toast.success('Announcement updated.')
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  })
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteAnnouncement(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] })
      toast.success('Announcement deleted.')
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
