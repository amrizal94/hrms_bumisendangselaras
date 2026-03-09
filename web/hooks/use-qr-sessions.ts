import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deactivateQrSession, fetchQrSessions, generateQrSession } from '@/lib/qr-session-api'
import type { GenerateQrSessionPayload } from '@/types/qr-session'

export function useQrSessions(date?: string) {
  return useQuery({
    queryKey: ['qr-sessions', date ?? 'today'],
    queryFn: () => fetchQrSessions(date),
  })
}

export function useGenerateQrSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: GenerateQrSessionPayload) => generateQrSession(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qr-sessions'] }),
  })
}

export function useDeactivateQrSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deactivateQrSession(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qr-sessions'] }),
  })
}
