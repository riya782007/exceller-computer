/**
 * Signed owner-console session.
 *
 * The cookie is a bearer token, so its value must be unforgeable on its own —
 * checking that it merely "looks long enough" would let anyone mint one. Each
 * token is `expiry.nonce.hmac`, signed with a server-only secret, so a client
 * can present a session only if this server issued it.
 *
 * Implemented on Web Crypto (`crypto.subtle`) rather than Node's `crypto`
 * because this module is imported by `src/middleware.ts`, which Next.js runs on
 * the Edge runtime where Node built-ins are unavailable. Web Crypto is present
 * in Edge, Node 18+ and browsers, so one implementation serves every caller.
 */
export const ADMIN_SESSION_COOKIE = 'exeller-admin-session'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

const encoder = new TextEncoder()

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

  // Deliberately unstable: with no secret configured, every deployment
  // invalidates sessions rather than falling back to a guessable value.
  return `exeller-unconfigured-${process.env.VERCEL_DEPLOYMENT_ID ?? 'local'}`
}

function toHex(bytes: Uint8Array): string {
  let hex = ''
  for (const byte of bytes) hex += byte.toString(16).padStart(2, '0')
  return hex
}

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return toHex(new Uint8Array(signature))
}

/**
 * Length-safe, branch-free comparison. Both inputs here are fixed-length hex
 * digests, so an early length check leaks nothing useful.
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let difference = 0
  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index)
  }
  return difference === 0
}

/** Constant-time comparison for user-supplied secrets such as the access code. */
export async function safeEqualSecret(a: string, b: string): Promise<boolean> {
  // Hashing first means differing lengths cannot short-circuit the comparison.
  const [left, right] = await Promise.all([hmacHex('compare', a), hmacHex('compare', b)])
  return constantTimeEqual(left, right)
}

export async function issueSessionToken(): Promise<string> {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000
  const nonce = toHex(crypto.getRandomValues(new Uint8Array(16)))
  const payload = `${expiresAt}.${nonce}`
  return `${payload}.${await hmacHex(signingSecret(), payload)}`
}

/**
 * Verifies signature and expiry. Safe to call from middleware (Edge runtime),
 * server components and server actions.
 */
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false

  const parts = token.split('.')
  if (parts.length !== 3) return false

  const [expiry, nonce, signature] = parts
  if (!expiry || !nonce || !signature) return false

  const expiresAt = Number(expiry)
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false

  return constantTimeEqual(signature, await hmacHex(signingSecret(), `${expiry}.${nonce}`))
}

/** SHA-256 hex digest, used for privacy-preserving rate-limit keys. */
export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value))
  return toHex(new Uint8Array(digest))
}
