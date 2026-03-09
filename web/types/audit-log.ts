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

export interface AuditLogParams {
  action?: string
  from?: string
  to?: string
  page?: number
  per_page?: number
}
