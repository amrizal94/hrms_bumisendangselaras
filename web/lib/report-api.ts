import { api } from './api'
import type {
  AttendanceReportMeta,
  AttendanceReportRow,
  DailyTrendRow,
  DepartmentTodayMeta,
  DepartmentTodayRow,
  LeaveReportRow,
  OverviewData,
  OvertimeReportMeta,
  OvertimeReportRow,
  PayrollReportRow,
  PayrollReportTotals,
} from '@/types/report'

export async function fetchOverview(): Promise<{ success: boolean; data: OverviewData }> {
  const res = await api.get('/reports/overview')
  return res.data
}

export async function fetchAttendanceReport(params: {
  year: number
  month: number
  department_id?: number
}): Promise<{ success: boolean; data: AttendanceReportRow[]; meta: AttendanceReportMeta }> {
  const q = new URLSearchParams({ year: String(params.year), month: String(params.month) })
  if (params.department_id) q.set('department_id', String(params.department_id))
  const res = await api.get(`/reports/attendance?${q}`)
  return res.data
}

export async function fetchLeaveReport(params: {
  year: number
  department_id?: number
}): Promise<{ success: boolean; data: LeaveReportRow[]; meta: { year: number; total_employees: number } }> {
  const q = new URLSearchParams({ year: String(params.year) })
  if (params.department_id) q.set('department_id', String(params.department_id))
  const res = await api.get(`/reports/leave?${q}`)
  return res.data
}

export async function fetchPayrollReport(params: {
  year: number
  month: number
  department_id?: number
  status?: string
}): Promise<{ success: boolean; data: PayrollReportRow[]; meta: { year: number; month: number; totals: PayrollReportTotals } }> {
  const q = new URLSearchParams({ year: String(params.year), month: String(params.month) })
  if (params.department_id) q.set('department_id', String(params.department_id))
  if (params.status) q.set('status', params.status)
  const res = await api.get(`/reports/payroll?${q}`)
  return res.data
}

export async function fetchOvertimeReport(params: {
  year: number
  month: number
  department_id?: number
}): Promise<{ success: boolean; data: OvertimeReportRow[]; meta: OvertimeReportMeta }> {
  const q = new URLSearchParams({ year: String(params.year), month: String(params.month) })
  if (params.department_id) q.set('department_id', String(params.department_id))
  const res = await api.get(`/reports/overtime?${q}`)
  return res.data
}

export async function fetchDailyTrend(params: {
  year: number
  month: number
}): Promise<{ success: boolean; data: DailyTrendRow[]; meta: { year: number; month: number; total_employees: number } }> {
  const q = new URLSearchParams({ year: String(params.year), month: String(params.month) })
  const res = await api.get(`/reports/daily-trend?${q}`)
  return res.data
}

export async function fetchDepartmentToday(): Promise<{
  success: boolean
  data: DepartmentTodayRow[]
  meta: DepartmentTodayMeta
}> {
  const res = await api.get('/reports/department-today')
  return res.data
}
