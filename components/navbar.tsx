import Link from 'next/link'
import { unstable_rethrow } from 'next/navigation'
import { Award, LogOut, ShieldCheck, UserRound } from 'lucide-react'
import { logoutAction } from '@/app/actions/auth'
import { getCurrentUser } from '@/lib/auth'

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export async function Navbar() {
  const user = await getCurrentUser().catch((error) => {
    unstable_rethrow(error)
    console.error('Unable to load the navigation session:', error)
    return null
  })

  return (
    <nav className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur print:hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={user ? (user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard') : '/'}
              className="flex items-center gap-2.5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
                <Award className="h-5 w-5" />
              </span>
              <span className="truncate text-sm font-black tracking-tight text-slate-900 sm:text-base">
                KTU Activity Points
              </span>
            </Link>
            <span className="hidden rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 sm:inline-block">
              2024 Scheme
            </span>
          </div>

          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1 pr-3 sm:flex">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[10px] font-black text-slate-700 shadow-sm">
                  {initials(user.name) || <UserRound className="h-3.5 w-3.5" />}
                </span>
                <span className="max-w-[150px] truncate text-xs font-semibold text-slate-800">
                  {user.name}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-black ${
                    user.role === 'ADMIN'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {user.role === 'ADMIN' ? (
                    <span className="inline-flex items-center">
                      <ShieldCheck className="mr-0.5 h-2.5 w-2.5" />
                      ADVISOR
                    </span>
                  ) : (
                    'STUDENT'
                  )}
                </span>
              </div>

              <form action={logoutAction}>
                <button
                  type="submit"
                  className="inline-flex items-center rounded-lg p-2 text-xs font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="ml-1.5 hidden sm:inline">Logout</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-indigo-600"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
