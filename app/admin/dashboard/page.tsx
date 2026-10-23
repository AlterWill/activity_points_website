import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getAdminDashboardData } from '@/lib/queries'
import { AdminDashboardClient } from './admin-client'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const { submissions, students } = await getAdminDashboardData()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AdminDashboardClient adminUser={user} submissions={submissions} students={students} />
    </div>
  )
}
