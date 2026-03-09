import { useQuery } from '@tanstack/react-query'
import { fetchAllAuditLogs } from '@/lib/audit-log-api'
import type { AuditLogParams } from '@/types/audit-log'

export function useAllAuditLogs(params?: AuditLogParams) {
  return useQuery({
    queryKey: ['audit-logs-all', params],
    queryFn: () => fetchAllAuditLogs(params),
    staleTime: 30_000,
  })
}
