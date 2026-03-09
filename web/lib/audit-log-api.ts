import { api } from './api'
import type { AuditLogEntry, AuditLogMeta, AuditLogParams } from '@/types/audit-log'

export async function fetchAllAuditLogs(params?: AuditLogParams): Promise<{
  data: AuditLogEntry[]
  meta: AuditLogMeta
}> {
  const search = new URLSearchParams()
  if (params?.action && params.action !== 'all') search.set('action', params.action + '%')
  if (params?.from) search.set('from', params.from)
  if (params?.to)   search.set('to', params.to)
  if (params?.page) search.set('page', String(params.page))
  search.set('per_page', String(params?.per_page ?? 30))

  const res = await api.get(`/audit-logs?${search.toString()}`)
  return res.data
}
