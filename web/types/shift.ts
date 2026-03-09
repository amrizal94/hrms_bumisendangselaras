export interface Shift {
  id: number
  name: string
  check_in_time: string        // "08:00"
  check_out_time: string       // "17:00"
  late_tolerance_minutes: number
  work_days: number[]          // [1..7], 1=Senin
  is_active: boolean
  employee_count?: number
  created_at: string
}

export interface ShiftFilters {
  search?: string
  is_active?: boolean
  page?: number
  per_page?: number
}

export interface CreateShiftData {
  name: string
  check_in_time: string
  check_out_time: string
  late_tolerance_minutes: number
  work_days: number[]
  is_active?: boolean
}

export type UpdateShiftData = Partial<CreateShiftData>
