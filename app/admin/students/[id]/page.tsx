import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Award, CheckCircle2, XCircle } from 'lucide-react'
import { PrintButton } from '@/components/print-button'
import { ProgressBar } from '@/components/progress-bar'
import { StatusBadge } from '@/components/status-badge'
import { formatDate, GROUP_LABELS, STUDENT_TYPE_LABELS } from '@/lib/format'
import { getCurrentUser } from '@/lib/auth'
import { getStudentReport } from '@/lib/queries'
import type { ActivityGroup } from '@/lib/types'

export const dynamic = 'force-dynamic'

const GROUPS: ActivityGroup[] = ['GROUP_1', 'GROUP_2', 'GROUP_3']

export default async function StudentReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const { id } = await params
  const report = await getStudentReport(id)

  if (!report) {
    notFound()
  }

  const { student, submissions } = report
  const approvedSubmissions = submissions.filter(
    (submission) => submission.status === 'APPROVED'
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to dashboard
        </Link>
        <PrintButton />
      </div>

      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10 print:border-0 print:shadow-none">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600">
            APJ Abdul Kalam Technological University · 2024 Scheme
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Student Activity Points Summary
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Prepared for Senior Faculty Advisor authentication.
          </p>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Student</p>
            <p className="mt-1 text-lg font-black text-slate-900">{student.name}</p>
            <p className="mt-0.5 text-sm text-slate-600">{student.registerNo || 'No register number'}</p>
            <p className="text-sm text-slate-600">{student.branch || 'No branch set'}</p>
            <p className="mt-1 text-sm text-slate-600">{student.email}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Student category
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {STUDENT_TYPE_LABELS[student.studentType]}
            </p>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Requirement
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              {student.targetTotal} total points · {student.targetPerGroup} in each group
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-slate-950 p-4 text-white">
            <p className="flex items-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <Award className="mr-1.5 h-3.5 w-3.5" />
              Total
            </p>
            <p className="mt-2 text-3xl font-black">{student.totalPoints}</p>
            <p className="text-xs text-slate-400">of {student.targetTotal} points</p>
          </div>

          {GROUPS.map((group) => {
            const points = student.groupPoints[group]
            const met = points >= student.targetPerGroup

            return (
              <div key={group} className="rounded-2xl border border-slate-200 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {GROUP_LABELS[group]}
                </p>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {points}
                  <span className="ml-1 text-xs font-semibold text-slate-400">
                    / {student.targetPerGroup}
                  </span>
                </p>
                <ProgressBar
                  value={points}
                  max={student.targetPerGroup}
                  tone={met ? 'emerald' : 'indigo'}
                  className="mt-2"
                />
                <p
                  className={`mt-2 text-[11px] font-bold ${
                    met ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {met ? 'Minimum met' : `${student.targetPerGroup - points} more needed`}
                </p>
              </div>
            )
          })}
        </section>

        <section className="mt-6">
          <div
            className={`flex items-start rounded-2xl border p-4 ${
              student.isEligible
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-amber-200 bg-amber-50'
            }`}
          >
            {student.isEligible ? (
              <CheckCircle2 className="mr-2 mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            ) : (
              <XCircle className="mr-2 mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            )}
            <div>
              <p
                className={`text-sm font-bold ${
                  student.isEligible ? 'text-emerald-800' : 'text-amber-800'
                }`}
              >
                {student.isEligible
                  ? 'Activity point requirement completed'
                  : 'Activity point requirement not yet completed'}
              </p>
              <p
                className={`mt-0.5 text-xs ${
                  student.isEligible ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {student.isEligible
                  ? 'All group minimums and the total target have been met.'
                  : 'The student must meet the total target and the minimum in every group.'}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-base font-bold text-slate-900">Verified activity record</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {approvedSubmissions.length} approved certificate
            {approvedSubmissions.length === 1 ? '' : 's'} included in this summary.
          </p>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-2 pr-3 font-semibold">Activity</th>
                  <th className="py-2 pr-3 font-semibold">Group</th>
                  <th className="py-2 pr-3 font-semibold">Claim</th>
                  <th className="py-2 pr-3 font-semibold">Approved</th>
                  <th className="py-2 pr-3 font-semibold">Reviewed</th>
                  <th className="py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      No certificates have been submitted.
                    </td>
                  </tr>
                ) : (
                  submissions.map((submission) => (
                    <tr key={submission.id}>
                      <td className="py-2.5 pr-3">
                        <span className="block font-semibold text-slate-800">
                          {submission.activityHead?.title || 'Activity'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {submission.activityHead?.code || ''}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-slate-600">
                        {GROUP_LABELS[submission.group]}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-600">
                        {submission.claimLabel || submission.level || '—'}
                      </td>
                      <td className="py-2.5 pr-3 font-bold text-slate-800">
                        {submission.status === 'APPROVED'
                          ? `${submission.approvedPoints ?? 0} pts`
                          : '—'}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-600">
                        {formatDate(submission.reviewedAt)}
                      </td>
                      <td className="py-2.5">
                        <StatusBadge status={submission.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10 grid gap-8 border-t border-slate-200 pt-8 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500">Student signature</p>
            <div className="mt-10 border-t border-slate-300" />
            <p className="mt-2 text-xs font-semibold text-slate-700">{student.name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Senior Faculty Advisor signature</p>
            <div className="mt-10 border-t border-slate-300" />
            <p className="mt-2 text-xs font-semibold text-slate-700">{user.name}</p>
          </div>
        </section>

        <p className="mt-6 text-[10px] text-slate-400">
          Generated on {formatDate(new Date())} · KTU 2024 Scheme Activity Points.
        </p>
      </article>
    </div>
  )
}
