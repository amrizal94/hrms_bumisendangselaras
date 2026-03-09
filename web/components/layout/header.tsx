'use client'

import Link from 'next/link'
import { LogOut, Menu, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/auth-store'
import { useLogout } from '@/hooks/use-auth'
import { NotificationBell } from './notification-bell'

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  hr: 'bg-green-100 text-green-700',
  staff: 'bg-blue-100 text-blue-700',
}

export function Header({ title, onMenuClick }: { title: string; onMenuClick?: () => void }) {
  const user = useAuthStore((s) => s.user)
  const { mutate: logout, isPending } = useLogout()

  return (
    <header className="h-16 border-b bg-white px-4 md:px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-slate-500"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-base md:text-lg font-semibold text-slate-900">{title}</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Notification bell */}
        <NotificationBell />

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-white text-sm font-bold">
                  {user?.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-slate-900 leading-none">{user?.name}</p>
                <Badge
                  variant="outline"
                  className={`text-[10px] mt-0.5 uppercase font-medium ${ROLE_COLORS[user?.role ?? 'staff']}`}
                >
                  {user?.role}
                </Badge>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div>
                <p className="font-medium text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/staff/profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => logout()}
              disabled={isPending}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isPending ? 'Logging out...' : 'Logout'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
