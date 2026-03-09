export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface LeaveType {
  id: number
  name: string
  code: string
  description?: string | null
  max_days_per_year: number
  is_paid: boolean
  is_active: boolean
}

export interface LeaveRequest {
  id: number
  start_date: string
  end_date: string
  total_days: number
  reason: string
  status: LeaveStatus
  rejection_reason?: string | null
  approved_at?: string | null
  leave_type?: {
    id: number
    name: string
    code: string
    is_paid: boolean
  }
  employee?: {
    id: number
    employee_number: string
    position: string
    user: { id: number; name: string; avatar: string | null }
    department: { id: number; name: string } | null
  }
  approved_by?: { id: number; name: string } | null
  created_at?: string
}

export interface LeaveQuota {
  leave_type: { id: number; name: string; code: string; is_paid: boolean }
  max_days: number
  used_days: number
  remaining: number
}

export interface LeaveFilters {
  status?: string
  employee_id?: number | string
  department_id?: number | string
  leave_type_id?: number | string
  date_from?: string
  date_to?: string
  search?: string
  page?: number
  per_page?: number
}

export interface ApplyLeaveData {
  leave_type_id: number
  start_date: string
  end_date: string
  reason: string
}
