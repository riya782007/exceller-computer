import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabasePublicEnv } from './env'

/**
 * Refreshes the Supabase auth session cookie and guards /admin routes.
 *
 * Scoped by the matcher in src/middleware.ts to auth-relevant routes only, so
 * public pages never pay for an auth round-trip and remain available even if
 * Supabase is unconfigured.
 */
interface SessionOptions {
  /** Treat the request as protected even when it is rewritten from a clean admin subdomain path. */
  protect?: boolean
  /** Internally render this path while preserving the browser URL. */
  rewritePath?: string
}

export async function updateSession(
  request: NextRequest,
  options: SessionOptions = {}
): Promise<NextResponse> {
  const { url: supabaseUrl, anonKey } = getSupabasePublicEnv()
  const rewriteUrl = options.rewritePath
    ? new URL(options.rewritePath, request.url)
    : undefined

  let supabaseResponse = rewriteUrl
    ? NextResponse.rewrite(rewriteUrl, { request })
    : NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = rewriteUrl
          ? NextResponse.rewrite(rewriteUrl, { request })
          : NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // getUser() revalidates the token against Supabase, unlike getSession() which
  // trusts the cookie contents. Since this gates /admin access, the extra
  // round-trip is the correct trade-off — a spoofed cookie must not pass.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && (options.protect || request.nextUrl.pathname.startsWith('/admin'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', options.rewritePath ?? request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
