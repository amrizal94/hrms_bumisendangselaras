import { NextRequest, NextResponse } from 'next/server'
import { TOKEN_KEY } from './lib/constants'

const PUBLIC_ROUTES = ['/login']
const ROLE_ROUTES: Record<string, string[]> = {
  admin: ['/admin'],
  hr: ['/hr', '/admin'],
  staff: ['/staff'],
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get(TOKEN_KEY)?.value
  const { pathname } = request.nextUrl

  // Public routes: redirect to dashboard if already logged in
  if (PUBLIC_ROUTES.includes(pathname)) {
    if (token) return NextResponse.redirect(new URL('/', request.url))
    return NextResponse.next()
  }

  // Protected routes: redirect to login if not logged in
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Exclude: API routes, Next.js internals, favicon, and any path with a file extension (static files)
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
