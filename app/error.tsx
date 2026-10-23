'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4 py-12">
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-black text-slate-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-600">
          The page could not be loaded. If this is a fresh setup, confirm that{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">DATABASE_URL</code> is set and
          run <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">pnpm db:push</code>, then{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">pnpm db:seed</code>.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <p className="mt-3 break-words rounded-xl bg-slate-50 p-3 text-left text-xs text-slate-500">
            {error.message}
          </p>
        )}

        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </button>
      </div>
    </div>
  )
}
