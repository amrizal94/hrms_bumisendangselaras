import { create } from 'zustand'
import type { User } from '@/types/auth'

interface AuthStore {
  user: User | null
  setUser: (user: User | null) => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  isAuthenticated: () => get().user !== null,
}))
