'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function LoginForm() {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const response = await fetch('/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim() }),
    })

    if (!response.ok) {
      setError('Invalid access code. Please try again.')
      setLoading(false)
      return
    }

    const redirect = searchParams.get('redirect') || '/admin/dashboard'
    router.push(redirect)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="access-code" className="block text-sm font-bold text-slate-900">
          Access code
        </label>
        <input
          id="access-code"
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          placeholder="Enter your access code"
          autoFocus
          autoComplete="off"
          required
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading || code.trim().length < 4}
        className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Verifying…' : 'Enter admin console'}
      </button>

      <p className="text-center text-xs text-slate-500">
        This code is provided by the business owner.
      </p>
    </form>
  )
}
