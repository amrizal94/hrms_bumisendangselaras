import { api } from './api'
import type { NotificationsResponse } from '@/types/notification'

export async function fetchNotifications(): Promise<NotificationsResponse> {
  const res = await api.get('/notifications')
  return res.data
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.post(`/notifications/${id}/read`)
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post('/notifications/read-all')
}
