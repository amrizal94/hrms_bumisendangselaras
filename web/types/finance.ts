// ── Shared ──────────────────────────────────────────────────────────────────

export interface UserRef {
  id: number
  name: string
}

// ── Finance Account ──────────────────────────────────────────────────────────

export type AccountType = 'bank' | 'cash' | 'e-wallet' | 'other'

export interface FinanceAccount {
  id: number
  name: string
  type: AccountType
  bank_name: string | null
  account_number: string | null
  account_holder: string | null
  balance: number
  description: string | null
  is_active: boolean
  created_by: number | null
  created_by_user?: UserRef | null
  created_at: string
  updated_at: string
}

export interface FinanceAccountSummary {
  total_balance: number
  count_by_type: Record<AccountType, number>
  total_accounts: number
}

export interface CreateFinanceAccountPayload {
  name: string
  type: AccountType
  bank_name?: string
  account_number?: string
  account_holder?: string
  balance?: number
  description?: string
  is_active?: boolean
}

// ── Finance Category ─────────────────────────────────────────────────────────

export type CategoryType = 'income' | 'expense'

export interface FinanceCategory {
  id: number
  name: string
  type: CategoryType
  color: string | null
  description: string | null
  is_active: boolean
  created_by: number | null
  created_at: string
  updated_at: string
}

export interface CreateFinanceCategoryPayload {
  name: string
  type: CategoryType
  color?: string
  description?: string
  is_active?: boolean
}

// ── Finance Income ───────────────────────────────────────────────────────────

export type FinanceStatus = 'pending' | 'approved' | 'rejected'

export interface FinanceIncome {
  id: number
  account_id: number
  category_id: number
  amount: number
  date: string
  reference_number: string | null
  source: string
  description: string | null
  attachment: string | null
  status: FinanceStatus
  rejection_note: string | null
  assigned_by: number | null
  created_by: number | null
  approved_by: number | null
  approved_at: string | null
  account?: Pick<FinanceAccount, 'id' | 'name' | 'type'>
  category?: Pick<FinanceCategory, 'id' | 'name' | 'type' | 'color'>
  assignedBy?: UserRef | null
  createdBy?: UserRef | null
  approvedBy?: UserRef | null
  created_at: string
  updated_at: string
}

export interface FinanceIncomeFilters {
  account_id?: number
  category_id?: number
  status?: FinanceStatus | ''
  date_from?: string
  date_to?: string
  search?: string
  page?: number
  per_page?: number
}

export interface CreateFinanceIncomePayload {
  account_id: number
  category_id: number
  amount: number
  date: string
  reference_number?: string
  source: string
  description?: string
  status?: FinanceStatus
  assigned_by?: number
}

// ── Finance Budget Project ───────────────────────────────────────────────────

export type BudgetProjectStatus = 'planning' | 'active' | 'completed' | 'cancelled'

export interface FinanceBudgetProject {
  id: number
  account_id: number
  name: string
  description: string | null
  total_budget: number
  spent_amount: number
  remaining_budget: number
  usage_percent: number
  start_date: string
  end_date: string | null
  status: BudgetProjectStatus
  notes: string | null
  assigned_by: number | null
  created_by: number | null
  account?: Pick<FinanceAccount, 'id' | 'name' | 'type'>
  assignedBy?: UserRef | null
  createdBy?: UserRef | null
  created_at: string
  updated_at: string
}

export interface BudgetProjectFilters {
  account_id?: number
  status?: BudgetProjectStatus | ''
  search?: string
  page?: number
  per_page?: number
}

export interface CreateBudgetProjectPayload {
  account_id: number
  name: string
  description?: string
  total_budget: number
  start_date: string
  end_date?: string
  status?: BudgetProjectStatus
  notes?: string
  assigned_by?: number
}

// ── Finance Expenditure ──────────────────────────────────────────────────────

export interface FinanceExpenditure {
  id: number
  account_id: number
  budget_project_id: number | null
  category_id: number
  amount: number
  date: string
  reference_number: string | null
  vendor: string | null
  description: string | null
  attachment: string | null
  status: FinanceStatus
  rejection_note: string | null
  assigned_by: number | null
  created_by: number | null
  approved_by: number | null
  approved_at: string | null
  account?: Pick<FinanceAccount, 'id' | 'name' | 'type'>
  budgetProject?: Pick<FinanceBudgetProject, 'id' | 'name'> | null
  category?: Pick<FinanceCategory, 'id' | 'name' | 'type' | 'color'>
  assignedBy?: UserRef | null
  createdBy?: UserRef | null
  approvedBy?: UserRef | null
  created_at: string
  updated_at: string
}

export interface FinanceExpenditureFilters {
  account_id?: number
  budget_project_id?: number
  category_id?: number
  status?: FinanceStatus | ''
  date_from?: string
  date_to?: string
  search?: string
  page?: number
  per_page?: number
}

export interface CreateFinanceExpenditurePayload {
  account_id: number
  budget_project_id?: number
  category_id: number
  amount: number
  date: string
  reference_number?: string
  vendor?: string
  description?: string
  assigned_by?: number
}

// ── Finance Dashboard ────────────────────────────────────────────────────────

export interface MonthlySummaryItem {
  month: string
  month_label: string
  income: number
  expenditure: number
}

export interface TopProjectItem {
  id: number
  name: string
  account: Pick<FinanceAccount, 'id' | 'name'> | null
  total_budget: number
  spent_amount: number
  remaining_budget: number
  usage_percent: number
  status: BudgetProjectStatus
}

export interface RecentTransactionItem {
  id: number
  type: 'income' | 'expenditure'
  date: string
  amount: number
  label: string
  status: FinanceStatus
  account: Pick<FinanceAccount, 'id' | 'name'> | null
  category: Pick<FinanceCategory, 'id' | 'name'> | null
}

export interface FinanceDashboard {
  total_balance: number
  total_income_this_month: number
  total_expenditure_this_month: number
  active_projects_count: number
  pending_expenditures_count: number
  monthly_summary: MonthlySummaryItem[]
  top_projects: TopProjectItem[]
  recent_transactions: RecentTransactionItem[]
}

// ── Paginated Response ───────────────────────────────────────────────────────

export interface PaginatedMeta {
  total: number
  per_page: number
  current_page: number
  last_page: number
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: PaginatedMeta
}
