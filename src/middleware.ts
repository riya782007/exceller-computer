import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  /*
   * Scoped deliberately to auth-relevant routes only.
   *
   * Running this on every path (the previous behaviour) meant:
   *   - the public site 500'd entirely if Supabase env vars were absent,
   *     because middleware throws before any page renders;
   *   - every public page load paid for a getUser() network round-trip to
   *     Supabase, which hurts the mobile/SEO performance goals for no benefit
   *     to anonymous visitors.
   *
   * /admin      — session refresh + access guard
   * /login      — session refresh so an already-signed-in user is recognised
   *
   * Server-side protection does not rely on this alone: admin/layout.tsx calls
   * getCurrentUser() and RLS enforces access at the data layer.
   */
  matcher: ['/admin/:path*', '/login'],
}
