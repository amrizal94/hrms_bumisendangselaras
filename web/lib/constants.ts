export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost/api/v1'

export const ROUTES = {
  login: '/login',
  admin: '/admin',
  hr: '/hr',
  staff: '/staff',
  manager: '/manager',
  director: '/admin',
  unauthorized: '/unauthorized',
} as const

export const ROLE_ROUTES: Record<string, string> = {
  admin: ROUTES.admin,
  hr: ROUTES.hr,
  staff: ROUTES.staff,
  manager: ROUTES.manager,
  director: ROUTES.admin,
}

export const TOKEN_KEY = 'bsshrms_token'
