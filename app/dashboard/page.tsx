import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getCatalog, getStudentSubmissions } from '@/lib/queries'
import { getCertificateStorageUsage } from '@/lib/storage'
import { StudentDashboardClient } from './student-client'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'STUDENT') {
    redirect('/admin/dashboard')
  }

  const [categories, submissions, storage] = await Promise.all([
    getCatalog(),
    getStudentSubmissions(user.id),
    getCertificateStorageUsage(),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <StudentDashboardClient
        user={user}
        categories={categories}
        submissions={submissions}
        storage={storage}
      />
    </div>
  )
}
