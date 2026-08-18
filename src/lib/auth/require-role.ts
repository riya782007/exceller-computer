import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types'

/**
 * Server-side role validation.
 * Call this at the start of any Server Action or API route that requires specific roles.
 * Throws an error if the user doesn't have the required role.
 */
export async function requireRole(...allowedRoles: UserRole[]): Promise<{
  userId: string
  role: UserRole
}> {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized: Not authenticated')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Unauthorized: Profile not found')
  }

  if (!allowedRoles.includes(profile.role)) {
    throw new Error(
      `Forbidden: Role '${profile.role}' does not have access. Required: ${allowedRoles.join(', ')}`
    )
  }

  return {
    userId: user.id,
    role: profile.role,
  }
}

/**
 * Get current authenticated user's profile (without role enforcement).
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<{
  userId: string
  role: UserRole
  fullName: string
} | null> {
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
  }
}
