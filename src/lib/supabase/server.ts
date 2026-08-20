import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import { getSupabasePublicEnv } from './env'

export async function createServerSupabaseClient(): Promise<
  ReturnType<typeof createServerClient<Database>>
> {
  const { url, anonKey } = getSupabasePublicEnv()
  const cookieStore = await cookies()

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Safe to ignore — middleware handles session refresh.
        }
      },
    },
  })
}
