import { api } from './api'
import type { Holiday, HolidayFormData } from '@/types/holiday'

export async function fetchHolidays(year?: number): Promise<Holiday[]> {
  const params = year ? { year } : {}
  const res = await api.get('/holidays', { params })
  return res.data.data
}

export async function fetchHolidayDates(year?: number): Promise<string[]> {
  const params = year ? { year } : {}
  const res = await api.get('/holidays/dates', { params })
  return res.data.data
}

export async function createHoliday(data: HolidayFormData): Promise<Holiday> {
  const res = await api.post('/holidays', data)
  return res.data.data
}

export async function updateHoliday(id: number, data: Partial<HolidayFormData>): Promise<Holiday> {
  const res = await api.put(`/holidays/${id}`, data)
  return res.data.data
}

export async function deleteHoliday(id: number): Promise<void> {
  await api.delete(`/holidays/${id}`)
}
