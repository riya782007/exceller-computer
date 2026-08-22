import { cookies } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types'
import { ADMIN_SESSION_COOKIE, verifySessionToken } from './console-session'

/**
 * The owner signs in with a single access code (see /api/admin-auth), which sets
 * an httpOnly session cookie. That is the primary path for this business: one
 * owner, one console, no user directory to maintain.
 *
 * Supabase auth is still honoured when a real staff account exists, so a future
 * multi-technician rollout works without rewriting every server action.
 */
export interface AuthenticatedActor {
  userId: string | null
  role: UserRole
  fullName: string
  /** 'access_code' = owner console session, 'supabase' = provisioned staff account. */
  method: 'access_code' | 'supabase'
}

async function hasAccessCodeSession(): Promise<boolean> {
  const cookieStore = await cookies()
  // Signature + expiry are verified: a cookie this server did not issue is rejected.
  return verifySessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)
}

/**
 * Resolves the current console actor, or null when nobody is signed in.
 * Never throws — callers decide how to handle an anonymous visitor.
 */
export async function getCurrentUser(): Promise<AuthenticatedActor | null> {
  if (await hasAccessCodeSession()) {
    return { userId: null, role: 'admin', fullName: 'Owner', method: 'access_code' }
  }

  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()
    if (!profile) return null

    return {
      userId: user.id,
      role: profile.role,
      fullName: profile.full_name,
      method: 'supabase',
    }
  } catch {
    // Supabase misconfiguration must not present as a crash on an admin page.
    return null
  }
}

/**
 * Server-side authorisation gate for Server Actions and route handlers.
 * Throws when the caller is not signed in or lacks an allowed role.
 */
export async function requireRole(...allowedRoles: UserRole[]): Promise<{
  userId: string | null
  role: UserRole
}> {
  const actor = await getCurrentUser()

  if (!actor) {
    throw new Error('Unauthorized: Not authenticated')
  }

  if (!allowedRoles.includes(actor.role)) {
    throw new Error(
      `Forbidden: Role '${actor.role}' does not have access. Required: ${allowedRoles.join(', ')}`
    )
  }

  return { userId: actor.userId, role: actor.role }
}
