import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

function isAdminHost(request: NextRequest): boolean {
  const hostname = (request.headers.get('host') ?? '').split(':')[0].toLowerCase()
  const configuredHost = process.env.ADMIN_CONSOLE_HOST?.toLowerCase()

  // The configured host makes this explicit in production. The conventional
  // fallback lets admin.exellercomputer.com work once that subdomain is added.
  return hostname === configuredHost || hostname.startsWith('admin.')
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isAdminHost(request)) {
    // Keep a clean separate console URL. For example, the browser sees
    // admin.exellercomputer.com/jobs while Next renders /admin/jobs.
    const rewritePath = pathname === '/'
      ? '/admin/dashboard'
      : pathname === '/login' || pathname.startsWith('/admin')
        ? undefined
        : `/admin${pathname}`

    return updateSession(request, {
      protect: pathname !== '/login',
      rewritePath,
    })
  }

  // Public-domain routes do not touch Supabase, preserving visitor-page speed.
  if (pathname.startsWith('/admin') || pathname === '/login') {
    return updateSession(request)
  }

  return NextResponse.next()
}

export const config = {
  // Static assets and API/webhook calls must not be rewritten to the console.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
