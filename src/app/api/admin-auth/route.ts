import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const ADMIN_CODE = process.env.ADMIN_ACCESS_CODE || 'excellercomputer2026'
const COOKIE_NAME = 'exeller-admin-session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null)
  const code = typeof body === 'object' && body !== null && 'code' in body
    ? String((body as { code: unknown }).code).trim()
    : ''

  if (!code || code !== ADMIN_CODE) {
    return NextResponse.json({ error: 'Invalid access code.' }, { status: 401 })
  }

  const token = generateSessionToken()
  const cookieStore = await cookies()

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })

  return NextResponse.json({ success: true })
}
