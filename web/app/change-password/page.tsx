'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ROLE_ROUTES } from '@/lib/constants'
import { useAuthStore } from '@/store/auth-store'
import type { ApiResponse, User } from '@/types/auth'

export default function ChangePasswordPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, setUser } = useAuthStore()

  const [password, setPassword]             = useState('')
  const [confirmation, setConfirmation]     = useState('')
  const [showPass, setShowPass]             = useState(false)
  const [showConfirm, setShowConfirm]       = useState(false)
  const [isSubmitting, setIsSubmitting]     = useState(false)
  const [error, setError]                   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmation) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      const { data } = await api.post<ApiResponse<{ user: User }>>('/auth/change-password', {
        password,
        password_confirmation: confirmation,
      })
      if (!data.success) throw new Error(data.message)

      // Update Zustand store and React Query cache immediately with fresh user data
      // (setQueryData prevents DashboardLayout from seeing stale must_change_password: true)
      setUser(data.data!.user)
      queryClient.setQueryData(['me'], data.data!.user)

      const dest = data.data!.user.role ? ROLE_ROUTES[data.data!.user.role] ?? '/' : '/'
      router.replace(dest)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to change password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-amber-100">
              <KeyRound className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <CardTitle>Set New Password</CardTitle>
          <CardDescription>
            {user?.name ? `Hi ${user.name}, your` : 'Your'} account requires a password change before you can continue.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  autoFocus
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmation">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmation"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isSubmitting ? 'Saving...' : 'Set New Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
