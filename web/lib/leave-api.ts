import { api } from './api'
import type { ApplyLeaveData, LeaveFilters, LeaveQuota, LeaveRequest, LeaveType } from '@/types/leave'
import type { PaginatedMeta } from '@/types/employee'

interface PaginatedLeave {
  data: LeaveRequest[]
  meta: PaginatedMeta
}

export async function fetchLeaveTypes(): Promise<LeaveType[]> {
  const res = await api.get('/leave-types')
  return res.data.data
}

export async function fetchLeaves(filters: LeaveFilters = {}): Promise<PaginatedLeave> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  )
  const res = await api.get('/leave', { params })
  return res.data
}

export async function fetchMyLeaves(filters: LeaveFilters = {}): Promise<PaginatedLeave> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  )
  const res = await api.get('/leave/my', { params })
  return res.data
}

export async function fetchLeaveQuota(): Promise<LeaveQuota[]> {
  const res = await api.get('/leave/quota')
  return res.data.data
}

export async function applyLeave(data: ApplyLeaveData): Promise<LeaveRequest> {
  const res = await api.post('/leave', data)
  return res.data.data
}

export async function cancelLeave(id: number): Promise<void> {
  await api.delete(`/leave/${id}`)
}

export async function approveLeave(id: number): Promise<LeaveRequest> {
  const res = await api.post(`/leave/${id}/approve`)
  return res.data.data
}

export async function rejectLeave(id: number, rejection_reason: string): Promise<LeaveRequest> {
  const res = await api.post(`/leave/${id}/reject`, { rejection_reason })
  return res.data.data
}

export async function updateLeaveType(
  id: number,
  data: { max_days_per_year: number; is_active: boolean }
): Promise<LeaveType> {
  const res = await api.put(`/leave-types/${id}`, data)
  return res.data.data
}
