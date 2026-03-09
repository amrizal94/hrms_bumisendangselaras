import { api } from './api'
import type { GenerateQrSessionPayload, QrSession } from '@/types/qr-session'

export async function fetchQrSessions(date?: string): Promise<QrSession[]> {
  const res = await api.get('/attendance/qr-sessions', {
    params: date ? { date } : undefined,
  })
  return res.data.data
}

export async function generateQrSession(data: GenerateQrSessionPayload): Promise<QrSession> {
  const res = await api.post('/attendance/qr-sessions', data)
  return res.data.data
}

export async function deactivateQrSession(id: number): Promise<QrSession> {
  const res = await api.post(`/attendance/qr-sessions/${id}/deactivate`)
  return res.data.data
}
