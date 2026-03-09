import { api } from './api'
import type { CreateShiftData, Shift, ShiftFilters, UpdateShiftData } from '@/types/shift'
import type { PaginatedMeta } from '@/types/employee'

export async function fetchMyShift(): Promise<Shift | null> {
  const res = await api.get('/my-shift')
  return res.data.data ?? null
}

interface PaginatedShifts {
  data: Shift[]
  meta: PaginatedMeta
}

export async function fetchShifts(filters: ShiftFilters = {}): Promise<PaginatedShifts> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  )
  const res = await api.get('/shifts', { params })
  return res.data
}

export async function createShift(data: CreateShiftData): Promise<Shift> {
  const res = await api.post('/shifts', data)
  return res.data.data
}

export async function updateShift(id: number, data: UpdateShiftData): Promise<Shift> {
  const res = await api.put(`/shifts/${id}`, data)
  return res.data.data
}

export async function deleteShift(id: number): Promise<void> {
  await api.delete(`/shifts/${id}`)
}
