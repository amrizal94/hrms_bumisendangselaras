import { api } from './api'
import type { Announcement, CreateAnnouncementData } from '@/types/announcement'

export async function fetchAnnouncements(filters?: { category?: string; limit?: number }): Promise<Announcement[]> {
  const params: Record<string, unknown> = {}
  if (filters?.category) params.category = filters.category
  if (filters?.limit) params.limit = filters.limit
  const res = await api.get('/announcements', { params })
  return res.data.data
}

export async function fetchAnnouncement(id: number): Promise<Announcement> {
  const res = await api.get(`/announcements/${id}`)
  return res.data.data
}

export async function createAnnouncement(data: CreateAnnouncementData): Promise<Announcement> {
  const res = await api.post('/announcements', data)
  return res.data.data
}

export async function updateAnnouncement(id: number, data: Partial<CreateAnnouncementData>): Promise<Announcement> {
  const res = await api.put(`/announcements/${id}`, data)
  return res.data.data
}

export async function deleteAnnouncement(id: number): Promise<void> {
  await api.delete(`/announcements/${id}`)
}
