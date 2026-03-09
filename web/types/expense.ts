export type ExpenseStatus   = 'pending' | 'approved' | 'rejected'
export type ExpenseCategory = 'transport' | 'meal' | 'accommodation' | 'supplies' | 'communication' | 'other'

export interface ExpenseType {
  id: number
  name: string
  code: string
  description: string | null
  is_active: boolean
}

export interface Expense {
  id: number
  expense_date: string
  amount: number
  category: string
  expense_type: ExpenseType | null
  description: string
  receipt_url: string | null
  status: ExpenseStatus
  rejection_reason?: string | null
  approved_at?: string | null
  approved_by?: { id: number; name: string } | null
  employee?: {
    id: number
    employee_number: string
    user: { id: number; name: string }
    department: { name: string } | null
  }
  created_at?: string
}

export interface ExpenseMeta {
  total: number
  per_page: number
  current_page: number
  last_page: number
}

export interface ExpenseFilters {
  status?: string
  category?: string
  employee_id?: number | string
  date_from?: string
  date_to?: string
  search?: string
  page?: number
  per_page?: number
}
