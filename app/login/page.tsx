'use client'

import { useState } from 'react'
import Link from 'next/link'
import { loginAction } from '@/app/actions/auth'
import {
  ArrowRight,
  Award,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const showDemoAccounts = process.env.NODE_ENV !== 'production'

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)

    try {
      const result = await loginAction(formData)

      if (result?.error) {
        setError(result.error)
        return
      }

      if (result?.redirectTo) {
        window.location.assign(result.redirectTo)
      }
    } catch {
      setError('Unable to sign in right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(demoEmail: string, demoPassword: string) {
    setEmail(demoEmail)
    setPassword(demoPassword)
    setError(null)
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 lg:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-10 text-white lg:flex">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
              <Award className="h-6 w-6 text-indigo-300" />
            </div>
            <h1 className="mt-8 text-3xl font-black leading-tight tracking-tight">
              One place for every activity point.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Students submit certificates. Faculty advisors verify them. Progress is calculated
              against the KTU 2024 Scheme automatically.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5">
              <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300" />
              <div>
                <p className="text-xs font-bold">Student dashboard</p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  120 total points and 40 in each group for regular students.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
              <div>
                <p className="text-xs font-bold">Faculty review queue</p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Approve, adjust or reject certificates with a clear audit trail.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mx-auto max-w-md">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white lg:hidden">
              <Award className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900 lg:mt-0">
              Sign in
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Use your student or faculty advisor account.
            </p>

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-bold text-slate-700">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    placeholder="you@college.edu"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-bold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-2 top-2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign in'}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </button>
            </form>

            {showDemoAccounts && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-center text-[11px] font-semibold text-slate-500">
                  Local demo accounts
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fillDemo('student@ktu.edu', 'student123')}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-2 py-2 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    <UserCheck className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemo('admin@ktu.edu', 'admin123')}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-2 py-2 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                    Advisor
                  </button>
                </div>
              </div>
            )}

            <p className="mt-6 text-center text-xs text-slate-600">
              New student?{' '}
              <Link href="/register" className="font-bold text-indigo-600 hover:text-indigo-500">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
