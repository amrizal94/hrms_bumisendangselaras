export interface FaceEnrollmentStatus {
  employee_id: number
  employee_number: string
  position: string
  user: { id: number; name: string; avatar: string | null }
  department: { id: number; name: string } | null
  is_enrolled: boolean
  face_data: {
    id: number
    is_active: boolean
    enrolled_at: string
    image_url: string | null
    enrolled_by: { id: number; name: string } | null
  } | null
}

export interface FaceEnrollmentMeta {
  total: number
  per_page: number
  current_page: number
  last_page: number
  enrolled: number
  not_enrolled: number
}

export interface IdentifyResult {
  employee_id: number
  employee: {
    id: number
    employee_number: string
    position: string
    user: { id: number; name: string; avatar: string | null }
    department: { id: number; name: string } | null
  }
  confidence: number
  distance: number
}

export interface FaceMyStatus {
  enrolled: boolean
  enrolled_at: string | null
}

export interface AuditLogEntry {
  id: number
  action: string
  actor: { name: string; email: string } | null
  target_employee: { id: number; employee_number: string; name: string | null } | null
  ip_address: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface AuditLogMeta {
  total: number
  per_page: number
  current_page: number
  last_page: number
}

export interface FaceAttendanceResult {
  success: boolean
  message: string
  confidence?: number
  data?: {
    id: number
    date: string
    check_in: string | null
    check_out: string | null
    status: string
    work_hours: number | null
    employee: {
      id: number
      user: { name: string }
    }
  }
}
