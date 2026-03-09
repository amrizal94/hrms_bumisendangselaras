import Cookies from 'js-cookie'
import { api } from './api'
import { TOKEN_KEY } from './constants'
import type { ApiResponse, AuthResponse, LoginCredentials, User } from '@/types/auth'

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials)
  if (!data.success || !data.data) throw new Error(data.message)

  const { token, token_type, user } = data.data
  Cookies.set(TOKEN_KEY, token, { expires: 7, sameSite: 'strict' })
  return { token, token_type, user }
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout')
  } finally {
    Cookies.remove(TOKEN_KEY)
  }
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<ApiResponse<{ user: User }>>('/auth/me')
  if (!data.success || !data.data) throw new Error(data.message)
  return data.data.user
}

export function getToken(): string | undefined {
  return Cookies.get(TOKEN_KEY)
}
