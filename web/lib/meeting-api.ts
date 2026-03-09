import { api } from './api'
import type { Meeting, MeetingRsvpEntry, CreateMeetingData } from '@/types/meeting'

export async function fetchMeetings(): Promise<Meeting[]> {
  const res = await api.get('/meetings')
  return res.data.data
}

export async function fetchMyMeetings(): Promise<Meeting[]> {
  const res = await api.get('/meetings/my')
  return res.data.data
}

export async function createMeeting(data: CreateMeetingData): Promise<Meeting> {
  const res = await api.post('/meetings', data)
  return res.data.data
}

export async function updateMeeting(id: number, data: Partial<CreateMeetingData>): Promise<Meeting> {
  const res = await api.put(`/meetings/${id}`, data)
  return res.data.data
}

export async function deleteMeeting(id: number): Promise<void> {
  await api.delete(`/meetings/${id}`)
}

export async function rsvpMeeting(id: number, status: 'accepted' | 'declined'): Promise<Meeting> {
  const res = await api.post(`/meetings/${id}/rsvp`, { status })
  return res.data.data
}

export async function fetchMeetingRsvps(id: number): Promise<{ rsvps: MeetingRsvpEntry[]; counts: { accepted: number; declined: number; total: number } }> {
  const res = await api.get(`/meetings/${id}/rsvps`)
  return res.data.data
}
