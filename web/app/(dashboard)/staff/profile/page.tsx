'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useUpdateProfile, useDeleteAccount } from '@/hooks/use-settings'
import { useAuthStore } from '@/store/auth-store'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name:                       z.string().min(1, 'Name is required'),
  email:                      z.string().email('Invalid email address'),
  phone:                      z.string().optional(),
  current_password_for_email: z.string().optional(),
})

const passwordSchema = z.object({
  current_password:      z.string().min(1, 'Current password is required'),
  password:              z.string().min(8, 'New password must be at least 8 characters'),
  password_confirmation: z.string().min(1, 'Please confirm password'),
}).refine(d => d.password === d.password_confirmation, {
  message: 'Passwords do not match',
  path: ['password_confirmation'],
})

type ProfileForm  = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StaffProfilePage() {
  const router  = useRouter()
  const user    = useAuthStore(s => s.user)
  const { mutate: updateProfile, isPending: isSaving } = useUpdateProfile()
  const { mutate: deleteAccount, isPending: isDeleting } = useDeleteAccount()

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput]             = useState('')

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', email: '', phone: '', current_password_for_email: '' },
  })

  const pwForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  // Sync form values when user data loads / changes
  useEffect(() => {
    if (user) {
      profileForm.reset({ name: user.name, email: user.email, phone: user.phone ?? '', current_password_for_email: '' })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const watchedEmail = profileForm.watch('email')
  const emailChanged = user ? watchedEmail !== user.email : false

  function onProfileSubmit(data: ProfileForm) {
    // Frontend guard: require password when email is being changed
    if (emailChanged && !data.current_password_for_email?.trim()) {
      profileForm.setError('current_password_for_email', { message: 'Password required to change email' })
      return
    }
    updateProfile(data, {
      onSuccess: () => {
        toast.success('Profile updated.')
        profileForm.setValue('current_password_for_email', '')
      },
      onError: (err: unknown) => {
        const errors = (err as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data?.errors
        if (errors?.current_password_for_email) {
          profileForm.setError('current_password_for_email', { message: errors.current_password_for_email[0] })
        } else {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          toast.error(msg ?? 'Failed to update profile.')
        }
      },
    })
  }

  function onPasswordSubmit(data: PasswordForm) {
    updateProfile(data, {
      onSuccess: () => { toast.success('Password changed.'); pwForm.reset() },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        toast.error(msg ?? 'Failed to change password.')
      },
    })
  }

  function handleDeleteAccount() {
    if (deleteInput !== 'DELETE') return
    deleteAccount(undefined, {
      onSuccess: () => {
        toast.success('Account deleted.')
        router.push('/login')
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        toast.error(msg ?? 'Failed to delete account.')
        setShowDeleteConfirm(false)
        setDeleteInput('')
      },
    })
  }

  const initial = (user?.name ?? 'U').charAt(0).toUpperCase()

  return (
    <DashboardLayout title="My Profile">
      <div className="max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your personal information and password</p>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {initial}
          </div>
          <div>
            <p className="font-semibold text-lg">{user?.name}</p>
            <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>

        <Separator />

        {/* 2-column layout */}
        <div className="grid md:grid-cols-2 gap-8">

          {/* ── Left: Personal Information ── */}
          <div>
            <h3 className="font-semibold mb-4">Personal Information</h3>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...profileForm.register('email')} />
                {profileForm.formState.errors.email && (
                  <p className="text-xs text-red-500">{profileForm.formState.errors.email.message}</p>
                )}
              </div>

              {/* Password confirmation — only shown when email is being changed */}
              {emailChanged && (
                <div className="space-y-1.5 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3">
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-xs font-medium mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Email change requires password verification
                  </div>
                  <Label htmlFor="current_password_for_email">Current Password</Label>
                  <Input
                    id="current_password_for_email"
                    type="password"
                    placeholder="Enter your current password"
                    {...profileForm.register('current_password_for_email')}
                  />
                  {profileForm.formState.errors.current_password_for_email && (
                    <p className="text-xs text-red-500">{profileForm.formState.errors.current_password_for_email.message}</p>
                  )}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" {...profileForm.register('name')} />
                {profileForm.formState.errors.name && (
                  <p className="text-xs text-red-500">{profileForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...profileForm.register('phone')} placeholder="+62..." />
              </div>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Profile
              </Button>
            </form>
          </div>

          {/* ── Right: Change Password + Danger Zone ── */}
          <div className="space-y-8">

            {/* Change Password */}
            <div>
              <h3 className="font-semibold mb-4">Change Password</h3>
              <form onSubmit={pwForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="current_password">Current Password</Label>
                  <Input id="current_password" type="password" {...pwForm.register('current_password')} />
                  {pwForm.formState.errors.current_password && (
                    <p className="text-xs text-red-500">{pwForm.formState.errors.current_password.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">New Password</Label>
                  <Input id="password" type="password" {...pwForm.register('password')} />
                  {pwForm.formState.errors.password && (
                    <p className="text-xs text-red-500">{pwForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password_confirmation">Confirm New Password</Label>
                  <Input id="password_confirmation" type="password" {...pwForm.register('password_confirmation')} />
                  {pwForm.formState.errors.password_confirmation && (
                    <p className="text-xs text-red-500">{pwForm.formState.errors.password_confirmation.message}</p>
                  )}
                </div>
                <Button type="submit" variant="outline" disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Change Password
                </Button>
              </form>
            </div>

            <Separator />

            {/* Danger Zone */}
            <div>
              <h3 className="font-semibold text-red-600 mb-1 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Danger Zone
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Deleting your account is permanent and cannot be undone.
              </p>

              {!showDeleteConfirm ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete My Account
                </Button>
              ) : (
                <div className="border border-red-200 rounded-lg p-4 space-y-3 bg-red-50 dark:bg-red-950/20">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    Type <strong>DELETE</strong> to confirm account deletion:
                  </p>
                  <Input
                    value={deleteInput}
                    onChange={e => setDeleteInput(e.target.value)}
                    placeholder="DELETE"
                    className="border-red-300 focus-visible:ring-red-400"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deleteInput !== 'DELETE' || isDeleting}
                      onClick={handleDeleteAccount}
                    >
                      {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Confirm Delete
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setShowDeleteConfirm(false); setDeleteInput('') }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
