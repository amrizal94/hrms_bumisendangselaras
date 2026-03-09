import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchSettings, updateProfile, updateSettings, deleteAccount } from '@/lib/setting-api'
import { useAuthStore } from '@/store/auth-store'
import type { User } from '@/types/auth'

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
    staleTime: 5 * 60_000,
  })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  const setUser = useAuthStore((s) => s.setUser)
  const currentUser = useAuthStore((s) => s.user)
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['me'] })
      if (res.data?.user && currentUser) {
        setUser({ ...currentUser, ...(res.data.user as Partial<User>) })
      }
    },
  })
}

export function useDeleteAccount() {
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      setUser(null)
      // Clear all stored tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
      }
    },
  })
}
