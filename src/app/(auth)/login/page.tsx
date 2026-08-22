import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Admin Access',
  description: 'Enter the access code to manage Exeller Computer operations.',
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-xl text-white">E</div>
          <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-950">Admin Console</h1>
          <p className="mt-2 text-sm text-slate-600">
            Exeller Computer operations access
          </p>
        </div>
        <Suspense><LoginForm /></Suspense>
      </div>
    </div>
  )
}
