# FaceHRM Web

Next.js 15 web frontend for FaceHRM — Human Resource Management System.

## Stack

- **Framework**: Next.js 15 (App Router, standalone output)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: TanStack Query (server state) + Zustand (auth)
- **Auth**: Cookie-based (`facehrm_token`), middleware.ts route protection
- **Face**: face-api.js (lazy loaded from `/public/models/`)

## Features

| Module | Route | Roles |
|--------|-------|-------|
| Login | `/login` | Public |
| Admin Dashboard | `/admin` | Admin |
| HR Dashboard | `/hr` | HR |
| Staff Dashboard | `/staff` | Staff |
| Employee Management | `/admin/employees` | Admin |
| Attendance Management | `/admin/attendance` | Admin |
| Leave Management | `/admin/leave`, `/staff/leave` | Admin, Staff |
| Payroll | `/admin/payroll`, `/staff/payslip` | Admin, Staff |
| Face Enrollment | `/admin/face` | Admin |
| Reports | `/admin/reports` | Admin |
| Settings | `/admin/settings` | Admin |
| Task & Project | `/admin/projects`, `/staff/tasks` | Admin, HR, Staff |

## Dev Setup

```bash
npm install
npm run dev   # port 3002 (3000 taken by other app)
```

## Build

```bash
npm run build
# Output: .next/standalone/
# After build, copy:
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
```

## Key Patterns

- **API client**: `import { api } from './api'` (not `@/lib/api-client`)
- **Zod v4**: `z.string().email()` (not `z.email()`); use `z.string()` + manual `parseFloat()` for numbers
- **Radix Select**: Never use `value=""` — use sentinel `"all"` / `"none"` / `"unspecified"`
- **DashboardLayout**: requires `title` prop + optional `allowedRoles`
- **Optimistic update**: local state + `useRef` pendingCount pattern (see checklist-panel.tsx)

## Environment Variables

```env
NEXT_PUBLIC_API_URL=https://hrm.kreasikaryaarjuna.co.id/api/v1
```

## face-api.js Models

Models (7 files) live in `public/models/`. Lazy-loaded via `web/lib/face-api-loader.ts` singleton.
