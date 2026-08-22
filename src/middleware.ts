import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_SESSION_COOKIE, verifySessionToken } from '@/lib/auth/console-session'

function isAdminHost(request: NextRequest): boolean {
  const hostname = (request.headers.get('host') ?? '').split(':')[0].toLowerCase()
  const configuredHost = process.env.ADMIN_CONSOLE_HOST?.toLowerCase()
  return hostname === configuredHost || hostname.startsWith('admin.')
}

/** Same predicate the server actions use, so routing and authorisation agree. */
function hasAdminSession(request: NextRequest): boolean {
  return verifySessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)
}

function redirectToLogin(request: NextRequest, intendedPath: string) {
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  url.search = ''
  url.searchParams.set('redirect', intendedPath)
  return NextResponse.redirect(url)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isAdminHost(request)) {
    // Clean console URLs: the browser shows admin.exellercomputer.com/jobs
    // while Next renders /admin/jobs.
    const rewritePath =
      pathname === '/'
        ? '/admin/dashboard'
        : pathname === '/login' || pathname.startsWith('/admin')
          ? undefined
          : `/admin${pathname}`

    if (pathname !== '/login' && !hasAdminSession(request)) {
      return redirectToLogin(request, rewritePath ?? pathname)
    }

    if (rewritePath) {
      return NextResponse.rewrite(new URL(rewritePath, request.url))
    }

    return NextResponse.next()
  }

  if (pathname.startsWith('/admin') && !hasAdminSession(request)) {
    return redirectToLogin(request, pathname)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
