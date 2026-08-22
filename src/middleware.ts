import { NextResponse, type NextRequest } from 'next/server'

const COOKIE_NAME = 'exeller-admin-session'

function isAdminHost(request: NextRequest): boolean {
  const hostname = (request.headers.get('host') ?? '').split(':')[0].toLowerCase()
  const configuredHost = process.env.ADMIN_CONSOLE_HOST?.toLowerCase()
  return hostname === configuredHost || hostname.startsWith('admin.')
}

function hasAdminSession(request: NextRequest): boolean {
  return request.cookies.has(COOKIE_NAME)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isAdminHost(request)) {
    const rewritePath = pathname === '/'
      ? '/admin/dashboard'
      : pathname === '/login' || pathname.startsWith('/admin')
        ? undefined
        : `/admin${pathname}`

    if (pathname !== '/login' && !hasAdminSession(request)) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', rewritePath ?? pathname)
      return NextResponse.redirect(url)
    }

    if (rewritePath) {
      return NextResponse.rewrite(new URL(rewritePath, request.url))
    }

    return NextResponse.next()
  }

  if (pathname.startsWith('/admin')) {
    if (!hasAdminSession(request)) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
