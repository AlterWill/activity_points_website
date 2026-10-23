'use client'

import { Printer } from 'lucide-react'

export function PrintButton({ label = 'Print / Save as PDF' }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex items-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
    >
      <Printer className="mr-2 h-4 w-4" />
      {label}
    </button>
  )
}
