export type Role = 'admin' | 'hr' | 'staff' | 'manager' | 'director'

export interface User {
  id: number
  name: string
  email: string
  role: Role
  phone?: string
  avatar?: string
  is_active: boolean
  must_change_password: boolean
}

export interface AuthResponse {
  token: string
  token_type: string
  user: User
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
}

export interface LoginCredentials {
  email: string
  password: string
}
