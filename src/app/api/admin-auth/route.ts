import { createHash } from 'crypto'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  ADMIN_SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  issueSessionToken,
  safeEqualSecret,
} from '@/lib/auth/console-session'

/**
 * Owner console sign-in.
 *
 * One shared code, deliberately: this business has a single owner and no staff
 * directory to maintain. The compensating controls are a signed session cookie,
 * a constant-time comparison, and a shared attempt quota so the code cannot be
 * brute-forced.
 */
const DEFAULT_CODE = 'excellercomputer2026'
const MAX_ATTEMPTS_PER_MINUTE = 8

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
}

/**
 * Reuses the public-chat quota function so throttling survives across serverless
 * instances. If the RPC is unavailable we fail open on throttling only — the
 * code comparison below is still required — so a missing migration cannot lock
 * the owner out of their own console.
 */
async function withinAttemptQuota(request: NextRequest): Promise<boolean> {
  try {
    const salt = process.env.PUBLIC_CHAT_RATE_LIMIT_SALT ?? 'admin-auth'
    const keyHash = createHash('sha256').update(`admin-auth\u0000${salt}\u0000${clientKey(request)}`).digest('hex')
    const { data, error } = await createAdminClient().rpc('consume_public_agent_rate_limit', {
      p_key_hash: keyHash,
      p_max_requests: MAX_ATTEMPTS_PER_MINUTE,
    })
    if (error) return true
    return data !== false
  } catch {
    return true
  }
}

export async function POST(request: NextRequest) {
  if (!(await withinAttemptQuota(request))) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait a minute and try again.' },
      { status: 429 }
    )
  }

  const body: unknown = await request.json().catch(() => null)
  const submitted =
    typeof body === 'object' && body !== null && 'code' in body
      ? String((body as { code: unknown }).code).trim()
      : ''

  const expected = process.env.ADMIN_ACCESS_CODE?.trim() || DEFAULT_CODE

  if (!submitted || !safeEqualSecret(submitted, expected)) {
    return NextResponse.json({ error: 'Invalid access code.' }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set(ADMIN_SESSION_COOKIE, issueSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })

  return NextResponse.json({ success: true })
}

/** Sign out — clears the console session immediately. */
export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_SESSION_COOKIE)
  return NextResponse.json({ success: true })
}
