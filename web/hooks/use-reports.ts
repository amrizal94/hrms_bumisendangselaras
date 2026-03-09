import { useQuery } from '@tanstack/react-query'
import {
  fetchAttendanceReport,
  fetchDailyTrend,
  fetchDepartmentToday,
  fetchLeaveReport,
  fetchOverview,
  fetchOvertimeReport,
  fetchPayrollReport,
} from '@/lib/report-api'

export function useOverview() {
  return useQuery({
    queryKey: ['report-overview'],
    queryFn: fetchOverview,
    staleTime: 60_000,
  })
}

export function useAttendanceReport(params: { year: number; month: number; department_id?: number }) {
  return useQuery({
    queryKey: ['report-attendance', params],
    queryFn: () => fetchAttendanceReport(params),
  })
}

export function useLeaveReport(params: { year: number; department_id?: number }) {
  return useQuery({
    queryKey: ['report-leave', params],
    queryFn: () => fetchLeaveReport(params),
  })
}

export function usePayrollReport(params: { year: number; month: number; department_id?: number; status?: string }) {
  return useQuery({
    queryKey: ['report-payroll', params],
    queryFn: () => fetchPayrollReport(params),
  })
}

export function useOvertimeReport(params: { year: number; month: number; department_id?: number }) {
  return useQuery({
    queryKey: ['report-overtime', params],
    queryFn: () => fetchOvertimeReport(params),
  })
}

export function useDailyTrend(params: { year: number; month: number }) {
  return useQuery({
    queryKey: ['report-daily-trend', params],
    queryFn: () => fetchDailyTrend(params),
    staleTime: 60_000,
  })
}

export function useDepartmentToday() {
  return useQuery({
    queryKey: ['report-department-today'],
    queryFn: fetchDepartmentToday,
    staleTime: 60_000,
  })
}
