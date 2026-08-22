// Fails the build if this module is ever pulled into a client bundle,
// which would ship the service-role key to the browser.
import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Admin Supabase client with service role key.
 * USE ONLY in server-side code for privileged operations.
 * NEVER import this in client components or expose to the browser.
 */
export function createAdminClient(): ReturnType<typeof createClient<Database>> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin configuration. Check environment variables.')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
