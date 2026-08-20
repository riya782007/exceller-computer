/**
 * Supabase environment resolution.
 *
 * The public URL/key are read in several places (server client, browser client,
 * middleware). Previously each used `process.env.X!`, where the non-null
 * assertion satisfies TypeScript but does nothing at runtime — a missing value
 * surfaced as an opaque error from deep inside @supabase/ssr.
 *
 * These helpers fail fast with an actionable message instead.
 */

export interface SupabasePublicEnv {
  url: string
  anonKey: string
}

/** True when both public Supabase vars are present. */
export function hasSupabasePublicEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

/**
 * Returns the public Supabase config, or throws with setup instructions.
 */
export function getSupabasePublicEnv(): SupabasePublicEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const missing: string[] = []
  if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!anonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  if (missing.length > 0) {
    throw new Error(
      `Supabase is not configured. Missing: ${missing.join(', ')}. ` +
        'Add these in Vercel under Project Settings > Environment Variables ' +
        '(or .env.local for local development), then redeploy. ' +
        'Values are at Supabase Dashboard > Project Settings > API.'
    )
  }

  return { url: url as string, anonKey: anonKey as string }
}
