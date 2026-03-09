# BSS HRMS — CLAUDE.md

## Project Overview

**BSS HRMS** (Bumi Sendang Selaras Human Resource Management System)
- **Domain**: hrms.bumisendangselaras.co.id
- **Forked from**: FaceHRM
- **Purpose**: Internal HRMS for PT Bumi Sendang Selaras

---

## Tech Stack

### Backend (`/backend`)
- **Framework**: Laravel 11
- **Auth**: Laravel Sanctum (Bearer token)
- **Database**: PostgreSQL (production) / SQLite (local dev)
- **Roles**: `admin`, `director`, `hr`, `manager`, `staff`
- **Role middleware**: `role:admin|director` etc. (custom middleware)
- **Soft deletes**: Used on all main models

### Web (`/web`)
- **Framework**: Next.js 15 (App Router)
- **Auth**: Sanctum token stored in cookies (`TOKEN_KEY`)
- **State**: TanStack Query (React Query) for server state
- **UI**: shadcn/ui components (`/components/ui/`)
- **Forms**: Controlled state + mutations (no react-hook-form by convention)
- **Notifications**: `sonner` toast
- **HTTP client**: `axios` via `/lib/api.ts`

### Mobile (`/mobile`)
- React Native / Expo

---

## Feature Modules

### Core HRMS (inherited from FaceHRM)
- Authentication (Sanctum)
- Employees & Departments
- Attendance (QR + Face Recognition)
- Leave Requests
- Overtime Management
- Payroll & Payslips
- Shifts
- Projects & Tasks
- Meetings
- Expense Reimbursements
- Assets Management
- Announcements
- Activity Log / Audit Log
- Notifications (FCM + in-app)
- Face Enrollment (FaceHRM)
- Reports

### Financial Module (BSS addition)
- **Finance Accounts** — Bank/Cash/E-wallet account management with balance tracking
- **Finance Categories** — Income and expense category management
- **Finance Income** — Income recording with approval workflow; auto-updates account balance on approval
- **Finance Budget Projects** — Budget project allocation linked to accounts; tracks spent_amount
- **Finance Expenditure** — Expenditure recording with approval; deducts from account balance and increments project spent_amount on approval
- **Finance Dashboard** — Aggregated stats, monthly income vs expenditure summary, top projects, recent transactions

---

## Critical Rules

### Backend
1. **All API responses** must follow `{ success: bool, message?: string, data: ... }` structure
2. **Use DB::transaction()** for any operation that updates multiple tables (balance + income/expenditure)
3. **Route order matters**: specific routes (e.g. `accounts/summary`) MUST come BEFORE `apiResource()` to avoid Laravel treating "summary" as a model ID
4. **Finance routes** are under `middleware('role:admin|director')` — never expose to staff/hr/manager
5. **Soft deletes**: All finance models use `SoftDeletes`. On destroy of approved records, always rollback balances in the same transaction
6. **Namespace**: Finance controllers live in `App\Http\Controllers\Finance\` (not `Api\V1\`)

### Frontend (Next.js)
1. **Always use `DashboardLayout`** with `title` and `allowedRoles` props
2. **TanStack Query**: use `queryKey` arrays that match what mutations `invalidateQueries` — keep them consistent
3. **IDR formatting**: `new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })`
4. **API base URL**: configured via `API_BASE_URL` constant in `lib/constants.ts`
5. **No `react-hook-form`** — use controlled `useState` for forms
6. **Toast**: import from `sonner`, use `toast.success()` / `toast.error()` in mutation callbacks
7. **Types**: place in `web/types/<module>.ts`

---

## Key File Paths

### Backend
```
backend/
  app/Http/Controllers/
    Api/V1/           ← Core HRMS controllers
    Finance/          ← Financial module controllers
      FinanceAccountController.php
      FinanceCategoryController.php
      FinanceIncomeController.php
      FinanceBudgetProjectController.php
      FinanceExpenditureController.php
      FinanceDashboardController.php
  Models/
    FinanceAccount.php
    FinanceCategory.php
    FinanceIncome.php
    FinanceBudgetProject.php
    FinanceExpenditure.php
  routes/api.php
  database/seeders/
    DatabaseSeeder.php
    FinanceSeeder.php
```

### Frontend
```
web/
  types/finance.ts
  lib/finance-api.ts
  hooks/use-finance.ts
  app/(dashboard)/admin/finance/
    page.tsx                    ← Finance Dashboard
    accounts/page.tsx
    incomes/page.tsx
    budget-projects/page.tsx
    expenditures/page.tsx
  components/layout/sidebar.tsx
```

---

## API Prefix

All API routes: `/api/v1/`
Finance routes: `/api/v1/finance/...`

Finance endpoints:
- `GET  /finance/dashboard`
- `GET  /finance/accounts/summary`    ← must be before apiResource
- CRUD  `/finance/accounts`
- CRUD  `/finance/categories`
- CRUD  `/finance/incomes`
- `POST /finance/incomes/{id}/approve`
- `POST /finance/incomes/{id}/reject`
- CRUD  `/finance/budget-projects`
- `POST /finance/budget-projects/{id}/complete`
- CRUD  `/finance/expenditures`
- `POST /finance/expenditures/{id}/approve`
- `POST /finance/expenditures/{id}/reject`

---

## Running the Project

### Backend
```bash
cd backend
php artisan serve
php artisan db:seed --class=FinanceSeeder   # seed finance data only
```

### Frontend
```bash
cd web
npm run dev
```

---

## Database Notes

- Finance tables use `ilike` for case-insensitive search (PostgreSQL)
- `finance_budget_projects` has computed appended attributes: `remaining_budget`, `usage_percent`
- Balance updates use `increment`/`decrement` (atomic SQL) inside `DB::transaction()`
