export type PayrollStatus = 'draft' | 'finalized' | 'paid'

export interface PayrollRecord {
  id: number
  period_year: number
  period_month: number
  period_label: string

  // Earnings
  basic_salary: number
  allowances: number
  overtime_pay: number
  reimbursement?: number
  gross_salary: number

  // Deductions
  absent_deduction: number
  other_deductions: number
  tax_deduction: number
  bpjs_deduction: number
  total_deductions: number

  net_salary: number

  // Attendance
  working_days: number
  present_days: number
  absent_days: number
  leave_days: number

  status: PayrollStatus
  paid_at: string | null
  notes: string | null

  employee?: {
    id: number
    employee_number: string
    position: string
    user: { id: number; name: string; avatar: string | null }
    department: { id: number; name: string } | null
  }
}

export interface PayrollSummary {
  total_employees: number
  total_gross: number
  total_deductions: number
  total_net: number
  draft_count: number
  finalized_count: number
  paid_count: number
}

export interface PayrollFilters {
  year?: number | string
  month?: number | string
  department_id?: number | string
  status?: string
  search?: string
  page?: number
  per_page?: number
}

export interface EditPayrollData {
  allowances?: number
  overtime_pay?: number
  other_deductions?: number
  notes?: string | null
}
