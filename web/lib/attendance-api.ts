import { api } from './api'
import type { AttendanceFilters, AttendanceRecord, AttendanceSummary } from '@/types/attendance'
import type { PaginatedMeta } from '@/types/employee'

interface PaginatedAttendance {
  data: AttendanceRecord[]
  meta: PaginatedMeta
}

export async function fetchAttendance(filters: AttendanceFilters = {}): Promise<PaginatedAttendance> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  )
  const res = await api.get('/attendance', { params })
  return res.data
}

export async function fetchAttendanceSummary(date?: string): Promise<AttendanceSummary> {
  const res = await api.get('/attendance/summary', { params: date ? { date } : undefined })
  return res.data.data
}

export async function fetchTodayAttendance(): Promise<AttendanceRecord | null> {
  const res = await api.get('/attendance/today')
  return res.data.data
}

export async function fetchMyAttendance(filters: AttendanceFilters = {}): Promise<PaginatedAttendance> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  )
  const res = await api.get('/attendance/my', { params })
  return res.data
}

export async function checkIn(): Promise<AttendanceRecord> {
  const res = await api.post('/attendance/check-in')
  return res.data.data
}

export async function checkOut(): Promise<AttendanceRecord> {
  const res = await api.post('/attendance/check-out')
  return res.data.data
}

export async function createAttendance(data: {
  employee_id: number
  date: string
  check_in: string
  check_out?: string
  status?: string
  notes?: string
}): Promise<AttendanceRecord> {
  const res = await api.post('/attendance', data)
  return res.data.data
}

export async function updateAttendance(
  id: number,
  data: { check_in?: string; check_out?: string; status?: string; notes?: string }
): Promise<AttendanceRecord> {
  const res = await api.put(`/attendance/${id}`, data)
  return res.data.data
}

export async function deleteAttendance(id: number): Promise<void> {
  await api.delete(`/attendance/${id}`)
}
