'use client'

import { useState } from 'react'
import Link from 'next/link'
import { registerAction } from '@/app/actions/auth'
import {
  ArrowRight,
  Award,
  BookOpen,
  Eye,
  EyeOff,
  GraduationCap,
  Hash,
  Lock,
  Mail,
  User,
} from 'lucide-react'

const TARGET_TEXT: Record<string, string> = {
  REGULAR: '120 total points · minimum 40 in each group',
  LATERAL_ENTRY: '90 total points · minimum 30 in each group',
  PWD: '60 total points · minimum 20 in each group',
}

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [studentType, setStudentType] = useState('REGULAR')
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)
    const password = String(formData.get('password') || '')
    const confirmPassword = String(formData.get('confirmPassword') || '')

    if (password !== confirmPassword) {
      setError('The two passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setLoading(true)

    try {
      const result = await registerAction(formData)

      if (result?.error) {
        setError(result.error)
        return
      }

      if (result?.redirectTo) {
        window.location.assign(result.redirectTo)
      }
    } catch {
      setError('Unable to create your account right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-10">
        <div className="mx-auto max-w-2xl">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white">
            <Award className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Create your student profile
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Your student category automatically sets the correct KTU 2024 point targets.
          </p>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="mb-1.5 block text-xs font-bold text-slate-700">
                Full name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  maxLength={100}
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="Your full name"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="registerNo"
                  className="mb-1.5 block text-xs font-bold text-slate-700"
                >
                  KTU register number
                </label>
                <div className="relative">
                  <Hash className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    id="registerNo"
                    name="registerNo"
                    type="text"
                    required
                    maxLength={30}
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm uppercase text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    placeholder="TVE24CS042"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="branch"
                  className="mb-1.5 block text-xs font-bold text-slate-700"
                >
                  Branch / department
                </label>
                <div className="relative">
                  <BookOpen className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    id="branch"
                    name="branch"
                    type="text"
                    required
                    maxLength={100}
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    placeholder="Computer Science"
                  />
                </div>
              </div>
            </div>

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
                  maxLength={254}
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="you@college.edu"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-xs font-bold text-slate-700"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={72}
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    placeholder="At least 8 characters"
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

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-xs font-bold text-slate-700"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={72}
                    className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    placeholder="Repeat your password"
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="studentType"
                className="mb-1.5 block text-xs font-bold text-slate-700"
              >
                Student category
              </label>
              <div className="relative">
                <GraduationCap className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <select
                  id="studentType"
                  name="studentType"
                  value={studentType}
                  onChange={(event) => setStudentType(event.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="REGULAR">Regular B.Tech student</option>
                  <option value="LATERAL_ENTRY">Lateral entry student</option>
                  <option value="PWD">Person with disability (PwD)</option>
                </select>
              </div>
              <p className="mt-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-800">
                Your target: {TARGET_TEXT[studentType]}
              </p>
              <p className="mt-1.5 text-[11px] text-slate-500">
                Your faculty advisor will verify this category during certificate authentication.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? 'Creating account...' : 'Create account'}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </button>
          </form>

          <p className="mt-4 text-center text-[11px] text-slate-500">
            Faculty advisor accounts are created by the administrator and cannot be self-registered.
          </p>

          <p className="mt-4 text-center text-xs text-slate-600">
            Already registered?{' '}
            <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
