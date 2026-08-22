import { createHmac, randomBytes, timingSafeEqual } from 'crypto'

/**
 * Signed owner-console session.
 *
 * The cookie is a bearer token, so its value must be unforgeable on its own —
 * checking that it merely "looks long enough" would let anyone mint one. Each
 * token is `expiry.nonce.hmac`, signed with a server-only secret, so a client
 * can present a session only if this server issued it.
 */
export const ADMIN_SESSION_COOKIE = 'exeller-admin-session'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

/**
 * Signing secret. Falls back to the access code itself so a single-variable
 * deployment still gets real signatures; setting ADMIN_SESSION_SECRET lets the
 * owner rotate sessions without changing the code they type.
 */
function signingSecret(): string {
  const secret =
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_ACCESS_CODE ||
    process.env.WEBHOOK_SIGNING_SECRET
  if (secret && secret.length >= 8) return secret

  // Deliberately unstable: with no secret configured, every restart invalidates
  // sessions rather than falling back to a value an attacker could guess.
  return `exeller-unconfigured-${process.env.VERCEL_DEPLOYMENT_ID ?? 'local'}`
}

function sign(payload: string): string {
  return createHmac('sha256', signingSecret()).update(payload).digest('hex')
}

/** Compares two hex digests without leaking length or content through timing. */
function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'))
  } catch {
    return false
  }
}

/** Constant-time comparison for user-supplied secrets such as the access code. */
export function safeEqualSecret(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8')
  const right = Buffer.from(b, 'utf8')
  // Hash first so differing lengths do not short-circuit the comparison.
  const leftDigest = createHmac('sha256', 'compare').update(left).digest()
  const rightDigest = createHmac('sha256', 'compare').update(right).digest()
  return timingSafeEqual(leftDigest, rightDigest)
}

export function issueSessionToken(): string {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000
  const nonce = randomBytes(16).toString('hex')
  const payload = `${expiresAt}.${nonce}`
  return `${payload}.${sign(payload)}`
}

/**
 * Verifies signature and expiry. Safe to call from middleware (Node runtime)
 * and from server components/actions.
 */
export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false

  const parts = token.split('.')
  if (parts.length !== 3) return false

  const [expiry, nonce, signature] = parts
  if (!expiry || !nonce || !signature) return false

  const expiresAt = Number(expiry)
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false

  return safeEqualHex(signature, sign(`${expiry}.${nonce}`))
}
