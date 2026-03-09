export type AttendanceStatus = 'present' | 'late' | 'absent' | 'half_day' | 'on_leave'

export interface AttendanceRecord {
  id: number
  date: string
  check_in: string | null
  check_out: string | null
  status: AttendanceStatus
  work_hours: string | null
  notes: string | null
  check_in_method?: 'face' | 'manual' | 'admin' | 'qr' | null
  latitude?: number | null
  longitude?: number | null
  location_accuracy?: number | null
  is_mock_location?: boolean | null
  employee?: {
    id: number
    employee_number: string
    position: string
    user: { id: number; name: string; avatar: string | null }
    department: { id: number; name: string } | null
  }
}

export interface AttendanceSummary {
  date: string
  total_employees: number
  present: number
  late: number
  absent: number
  on_leave: number
}

export interface AttendanceFilters {
  date?: string
  date_from?: string
  date_to?: string
  employee_id?: number | string
  department_id?: number | string
  status?: string
  search?: string
  page?: number
  per_page?: number
}
