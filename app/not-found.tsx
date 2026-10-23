import Link from 'next/link'
import { ArrowLeft, SearchX } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4 py-12">
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <SearchX className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-black text-slate-900">Page not found</h1>
        <p className="mt-2 text-sm text-slate-600">
          The page or student record you requested does not exist.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to home
        </Link>
      </div>
    </div>
  )
}
