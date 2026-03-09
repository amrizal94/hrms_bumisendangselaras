export interface OverviewData {
  total_employees: number
  today: { present: number; late: number; absent: number }
  month_attendance: { present: number; late: number; absent: number; on_leave: number }
  pending_leaves: number
  payroll: { total_records: number; total_gross: number; total_net: number }
}

export interface AttendanceReportRow {
  employee_id: number
  employee_number: string
  name: string
  department: string | null
  working_days: number
  present_days: number
  late_days: number
  leave_days: number
  absent_days: number
  total_hours: number
  attendance_rate: number
}

export interface AttendanceReportMeta {
  year: number
  month: number
  working_days: number
  total_employees: number
}

export interface LeaveByType {
  leave_type_id: number
  leave_type_name: string
  days_used: number
}

export interface LeaveReportRow {
  employee_id: number
  employee_number: string
  name: string
  department: string | null
  approved_days: number
  pending_days: number
  rejected_count: number
  total_requests: number
  by_type: LeaveByType[]
}

export interface PayrollReportRow {
  employee_id: number
  employee_number: string
  name: string
  department: string | null
  basic_salary: number
  allowances: number
  overtime_pay: number
  gross_salary: number
  total_deductions: number
  net_salary: number
  present_days: number
  absent_days: number
  status: string
}

export interface PayrollReportTotals {
  total_gross: number
  total_net: number
  total_deductions: number
  count_draft: number
  count_finalized: number
  count_paid: number
}

export interface DailyTrendRow {
  date: string
  day: number
  weekday: string
  present: number
  late: number
  on_leave: number
  absent: number
  total_employees: number
  attendance_rate: number
}

export interface DepartmentTodayRow {
  department_id: number
  department_name: string
  department_code: string
  total: number
  present: number
  late: number
  on_leave: number
  absent: number
  attendance_rate: number
}

export interface DepartmentTodayMeta {
  date: string
  face_enrolled: number
  face_total: number
}

export interface OvertimeByType {
  type: string
  total_hours: number
  count: number
}

export interface OvertimeReportRow {
  employee_id: number
  employee_number: string
  name: string
  department: string | null
  total_requests: number
  approved_hours: number
  pending_hours: number
  by_type: OvertimeByType[]
}

export interface OvertimeReportMeta {
  year: number
  month: number
  total_employees: number
  total_approved_hours: number
  total_pending: number
}
