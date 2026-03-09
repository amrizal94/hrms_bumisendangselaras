export type OvertimeStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type OvertimeType = 'regular' | 'weekend' | 'holiday'

export interface OvertimeRequest {
  id: number
  date: string
  overtime_hours: number
  overtime_type: OvertimeType
  reason: string
  status: OvertimeStatus
  rejection_reason?: string | null
  notes?: string | null
  approved_at?: string | null
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

export interface OvertimeFilters {
  status?: string
  department_id?: number | string
  overtime_type?: string
  search?: string
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
}

export interface SubmitOvertimeData {
  date: string
  overtime_hours: number
  overtime_type: OvertimeType
  reason: string
  notes?: string
}

export interface OvertimeSummary {
  total: number
  pending: number
  approved: number
  rejected: number
  total_hours: number
}
