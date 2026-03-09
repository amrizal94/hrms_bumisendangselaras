import { api } from './api'
import type { OvertimeFilters, OvertimeRequest, OvertimeSummary, SubmitOvertimeData } from '@/types/overtime'
import type { PaginatedMeta } from '@/types/employee'

interface PaginatedOvertime {
  data: OvertimeRequest[]
  meta: PaginatedMeta
}

export async function fetchOvertimes(filters: OvertimeFilters = {}): Promise<PaginatedOvertime> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  )
  const res = await api.get('/overtime', { params })
  return res.data
}

export async function fetchMyOvertimes(filters: OvertimeFilters = {}): Promise<PaginatedOvertime> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  )
  const res = await api.get('/overtime/my', { params })
  return res.data
}

export async function fetchOvertimeSummary(): Promise<OvertimeSummary> {
  const res = await api.get('/overtime/summary')
  return res.data.data
}

export async function submitOvertime(data: SubmitOvertimeData): Promise<OvertimeRequest> {
  const res = await api.post('/overtime', data)
  return res.data.data
}

export async function approveOvertime(id: number): Promise<OvertimeRequest> {
  const res = await api.post(`/overtime/${id}/approve`)
  return res.data.data
}

export async function rejectOvertime(id: number, rejection_reason: string): Promise<OvertimeRequest> {
  const res = await api.post(`/overtime/${id}/reject`, { rejection_reason })
  return res.data.data
}

export async function cancelOvertime(id: number): Promise<void> {
  await api.delete(`/overtime/${id}`)
}
