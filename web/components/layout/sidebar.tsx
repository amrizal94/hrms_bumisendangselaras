'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth-store'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  Receipt,
  Settings,
  ScanFace,
  BarChart3,
  Timer,
  FolderKanban,
  CheckSquare,
  Bell,
  AlarmClock,
  UserCircle,
  Megaphone,
  History,
  Package,
  CircleDollarSign,
  Wallet,
  TrendingUp,
  TrendingDown,
  Layers,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  roles: string[]
  group: string
}

const NAV_ITEMS: NavItem[] = [
  // ── Main ──────────────────────────────────────────────────────────────────
  { label: 'Dashboard',     href: '/admin',               icon: LayoutDashboard, roles: ['admin', 'director'],                       group: 'Main' },
  { label: 'Dashboard',     href: '/hr',                  icon: LayoutDashboard, roles: ['hr'],                                      group: 'Main' },
  { label: 'Dashboard',     href: '/staff',               icon: LayoutDashboard, roles: ['staff'],                                   group: 'Main' },
  { label: 'Dashboard',     href: '/manager',             icon: LayoutDashboard, roles: ['manager'],                                 group: 'Main' },

  // ── People ────────────────────────────────────────────────────────────────
  { label: 'Employees',     href: '/admin/employees',     icon: Users,           roles: ['admin', 'hr', 'manager', 'director'],      group: 'People' },
  { label: 'Face Data',     href: '/admin/face',          icon: ScanFace,        roles: ['admin', 'hr', 'manager', 'director'],      group: 'People' },

  // ── Time & Leave ──────────────────────────────────────────────────────────
  { label: 'Attendance',    href: '/admin/attendance',    icon: Clock,           roles: ['admin', 'hr', 'manager', 'director'],      group: 'Time & Leave' },
  { label: 'Leave',         href: '/admin/leave',         icon: CalendarDays,    roles: ['admin', 'hr', 'manager', 'director'],      group: 'Time & Leave' },
  { label: 'Overtime',      href: '/admin/overtime',      icon: Timer,           roles: ['admin', 'hr', 'manager', 'director'],      group: 'Time & Leave' },
  { label: 'Holidays',      href: '/admin/holidays',      icon: CalendarDays,    roles: ['admin', 'hr', 'manager', 'director'],      group: 'Time & Leave' },

  // ── Finance ───────────────────────────────────────────────────────────────
  { label: 'Payroll',          href: '/admin/payroll',                  icon: Receipt,           roles: ['admin', 'hr', 'director'],            group: 'Finance' },
  { label: 'Reports',          href: '/admin/reports',                  icon: BarChart3,         roles: ['admin', 'hr', 'manager', 'director'], group: 'Finance' },
  { label: 'Assets',           href: '/admin/assets',                   icon: Package,           roles: ['admin', 'hr', 'director'],            group: 'Finance' },
  { label: 'Keuangan',         href: '/admin/finance',                  icon: CircleDollarSign, roles: ['admin', 'director'],                  group: 'Finance' },
  { label: 'Rekening',         href: '/admin/finance/accounts',         icon: Wallet,            roles: ['admin', 'director'],                  group: 'Finance' },
  { label: 'Pemasukan',        href: '/admin/finance/incomes',          icon: TrendingUp,        roles: ['admin', 'director'],                  group: 'Finance' },
  { label: 'Budget Proyek',    href: '/admin/finance/budget-projects',  icon: Layers,            roles: ['admin', 'director'],                  group: 'Finance' },
  { label: 'Pengeluaran',      href: '/admin/finance/expenditures',     icon: TrendingDown,      roles: ['admin', 'director'],                  group: 'Finance' },

  // ── Operations ────────────────────────────────────────────────────────────
  { label: 'Projects',      href: '/admin/projects',      icon: FolderKanban,    roles: ['admin', 'hr', 'manager', 'director'],      group: 'Operations' },
  { label: 'Announcements', href: '/admin/announcements', icon: Megaphone,       roles: ['admin', 'hr', 'manager', 'director'],      group: 'Operations' },

  // ── System ────────────────────────────────────────────────────────────────
  { label: 'Activity Log',  href: '/admin/activity-log',  icon: History,         roles: ['admin', 'hr', 'director'],                 group: 'System' },
  { label: 'Settings',      href: '/admin/settings',      icon: Settings,        roles: ['admin', 'director'],                       group: 'System' },

  // ── Staff: My Work ────────────────────────────────────────────────────────
  { label: 'My Attendance', href: '/staff/attendance',    icon: Clock,           roles: ['staff'],                                   group: 'My Work' },
  { label: 'My Leave',      href: '/staff/leave',         icon: CalendarDays,    roles: ['staff'],                                   group: 'My Work' },
  { label: 'My Overtime',   href: '/staff/overtime',      icon: Timer,           roles: ['staff'],                                   group: 'My Work' },
  { label: 'My Tasks',      href: '/staff/tasks',         icon: CheckSquare,     roles: ['staff'],                                   group: 'My Work' },
  { label: 'My Shift',        href: '/staff/shift',         icon: AlarmClock,      roles: ['staff'],                                   group: 'My Work' },
  { label: 'Daftarkan Wajah', href: '/staff/face-enroll',  icon: ScanFace,        roles: ['staff'],                                   group: 'My Work' },
  { label: 'Holidays',        href: '/staff/holidays',      icon: CalendarDays,    roles: ['staff'],                                   group: 'My Work' },

  // ── Staff: Finance ────────────────────────────────────────────────────────
  { label: 'My Payslip',    href: '/staff/payslip',       icon: Receipt,         roles: ['staff'],                                   group: 'Finance' },
  { label: 'My Assets',     href: '/staff/assets',        icon: Package,         roles: ['staff'],                                   group: 'Finance' },

  // ── Staff: Info ───────────────────────────────────────────────────────────
  { label: 'Announcements', href: '/staff/announcements', icon: Megaphone,       roles: ['staff'],                                   group: 'Info' },

  // ── Personal (all roles) ──────────────────────────────────────────────────
  { label: 'My Profile',    href: '/staff/profile',       icon: UserCircle,      roles: ['staff', 'hr', 'admin', 'manager', 'director'], group: 'Personal' },
  { label: 'Notifications', href: '/notifications',       icon: Bell,            roles: ['admin', 'hr', 'staff', 'manager', 'director'], group: 'Personal' },
]

// Ordered group labels (determines display order)
const GROUP_ORDER = ['Main', 'People', 'Time & Leave', 'Finance', 'Operations', 'My Work', 'Info', 'System', 'Personal']

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const role = user?.role ?? 'staff'

  const filteredItems = NAV_ITEMS.filter((item) => item.roles.includes(role))

  // Group items preserving GROUP_ORDER
  const grouped = GROUP_ORDER.reduce<{ label: string; items: NavItem[] }[]>((acc, groupLabel) => {
    const items = filteredItems.filter((i) => i.group === groupLabel)
    if (items.length > 0) acc.push({ label: groupLabel, items })
    return acc
  }, [])

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    onClose?.()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const DASHBOARD_HREFS = new Set(['/admin', '/hr', '/staff', '/manager', '/director', '/admin/finance'])

  return (
    <>
      {/* Backdrop overlay — mobile only */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-slate-900 text-slate-100 transition-transform duration-300 ease-in-out',
          'lg:static lg:translate-x-0 lg:z-auto lg:shrink-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="BSS HRMS" className="w-8 h-8 rounded-lg object-contain" />
          <span className="text-lg font-bold tracking-tight">BSS HRMS</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {grouped.map((section, si) => (
            <div key={section.label} className={si > 0 ? 'mt-4' : ''}>
              {/* Section header — hidden for 'Main' (only 1 item anyway) */}
              {section.label !== 'Main' && (
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500 select-none">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = DASHBOARD_HREFS.has(item.href)
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      )}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User info */}
        {user && (
          <div className="px-4 py-4 border-t border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-slate-100 truncate">{user.name}</p>
                <p className="text-xs text-slate-400 uppercase">{user.role}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
