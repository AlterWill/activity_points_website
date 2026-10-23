import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { Navbar } from '@/components/navbar'
import './globals.css'

export const metadata: Metadata = {
  title: 'KTU Activity Points | 2024 Scheme',
  description:
    'Submit, track and verify APJ Abdul Kalam Technological University student activity points across Group I, II and III.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#4f46e5',
}

function NavbarFallback() {
  return (
    <nav className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur print:hidden" />
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900 antialiased">
        <Suspense fallback={<NavbarFallback />}>
          <Navbar />
        </Suspense>
        <main className="flex-1">{children}</main>
        <footer className="no-print border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p>KTU 2024 Scheme Activity Points Management System</p>
            <p>Certificates are visible only to the student and faculty advisors.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
