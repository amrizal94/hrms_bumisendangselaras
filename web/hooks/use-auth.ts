'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getMe, login, logout } from '@/lib/auth'
import { useAuthStore } from '@/store/auth-store'
import { ROLE_ROUTES } from '@/lib/constants'
import type { LoginCredentials } from '@/types/auth'

export function useMe() {
  const setUser = useAuthStore((s) => s.setUser)

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const user = await getMe()
      setUser(user)
      return user
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}

export function useLogin() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: (data) => {
      setUser(data.user)
      toast.success(`Welcome back, ${data.user.name}!`)
      const destination = ROLE_ROUTES[data.user.role] ?? '/staff'
      router.push(destination)
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Login failed. Please try again.'
      toast.error(message)
    },
  })
}

export function useLogout() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      setUser(null)
      queryClient.clear()
      router.push('/login')
    },
  })
}
