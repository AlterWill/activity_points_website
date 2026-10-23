'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Search,
  ShieldCheck,
  Users,
  XCircle,
} from 'lucide-react'
import { PrintButton } from '@/components/print-button'
import { ProgressBar } from '@/components/progress-bar'
import { StatusBadge } from '@/components/status-badge'
import {
  formatDate,
  GROUP_LABELS,
  STUDENT_TYPE_LABELS,
} from '@/lib/format'
import type {
  CurrentUser,
  StudentProgressDTO,
  SubmissionDTO,
  SubmissionStatus,
} from '@/lib/types'
import { ReviewModal } from './review-modal'

interface AdminDashboardClientProps {
  adminUser: CurrentUser
  submissions: SubmissionDTO[]
  students: StudentProgressDTO[]
}

type Filter = 'ALL' | SubmissionStatus

const FILTERS: Filter[] = ['PENDING', 'ALL', 'APPROVED', 'REJECTED']

export function AdminDashboardClient({
  adminUser,
  submissions,
  students,
}: AdminDashboardClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'STUDENTS'>('QUEUE')
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionDTO | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<Filter>('PENDING')
  const [studentSearch, setStudentSearch] = useState('')

  const pendingCount = submissions.filter((submission) => submission.status === 'PENDING').length
  const approvedCount = submissions.filter((submission) => submission.status === 'APPROVED').length
  const rejectedCount = submissions.filter((submission) => submission.status === 'REJECTED').length
  const eligibleCount = students.filter((student) => student.isEligible).length

  const filteredSubmissions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return submissions.filter((submission) => {
      if (statusFilter !== 'ALL' && submission.status !== statusFilter) return false
      if (!query) return true

      return (
        submission.student?.name.toLowerCase().includes(query) ||
        submission.student?.registerNo?.toLowerCase().includes(query) ||
        submission.activityHead?.title.toLowerCase().includes(query) ||
        submission.activityHead?.code.toLowerCase().includes(query)
      )
    })
  }, [submissions, statusFilter, searchQuery])

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase()
    if (!query) return students

    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.registerNo?.toLowerCase().includes(query) ||
        student.branch?.toLowerCase().includes(query)
    )
  }, [students, studentSearch])

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                Faculty advisor portal
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                KTU 2024 scheme
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Review student activity points
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Signed in as <span className="font-semibold text-slate-900">{adminUser.name}</span>
            </p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <span>Pending</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{pendingCount}</p>
          <p className="mt-1 text-[11px] text-slate-500">requests to review</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <span>Approved</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600">{approvedCount}</p>
          <p className="mt-1 text-[11px] text-slate-500">verified certificates</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <span>Rejected</span>
            <XCircle className="h-4 w-4 text-red-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-red-600">{rejectedCount}</p>
          <p className="mt-1 text-[11px] text-slate-500">invalid certificates</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <span>Eligible</span>
            <Award className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-indigo-600">{eligibleCount}</p>
          <p className="mt-1 text-[11px] text-slate-500">of {students.length} students</p>
        </div>
      </section>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('QUEUE')}
          className={`flex items-center px-1 pb-3 text-sm font-bold transition ${
            activeTab === 'QUEUE'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="mr-2 h-4 w-4" />
          Review requests
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
            {pendingCount} pending
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('STUDENTS')}
          className={`flex items-center px-1 pb-3 text-sm font-bold transition ${
            activeTab === 'STUDENTS'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="mr-2 h-4 w-4" />
          Students & points
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
            {students.length}
          </span>
        </button>
      </div>

      {activeTab === 'QUEUE' && (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search student, register no, activity..."
                className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
              {FILTERS.map((option) => {
                const count =
                  option === 'ALL'
                    ? submissions.length
                    : submissions.filter((submission) => submission.status === option).length

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setStatusFilter(option)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                      statusFilter === option
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {option === 'ALL' ? 'All' : option.toLowerCase()}
                    <span className="ml-1 text-[10px] opacity-70">({count})</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Activity</th>
                  <th className="px-4 py-3 font-semibold">Group</th>
                  <th className="px-4 py-3 font-semibold">Points</th>
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <CheckCircle2 className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        Nothing to review here
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Try a different filter or search term.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="transition hover:bg-slate-50/70">
                      <td className="px-4 py-4">
                        <span className="block text-xs font-bold text-slate-900">
                          {submission.student?.name || 'Unknown student'}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-slate-500">
                          {submission.student?.registerNo || 'No register no'}
                          {submission.student?.branch ? ` · ${submission.student.branch}` : ''}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="block text-xs font-semibold text-slate-800">
                          {submission.activityHead?.title || 'Activity'}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-slate-400">
                          {submission.activityHead?.code ? `${submission.activityHead.code} · ` : ''}
                          {submission.claimLabel || submission.level || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          {GROUP_LABELS[submission.group]}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs">
                        <span className="font-semibold text-slate-700">
                          {submission.claimedPoints} claimed
                        </span>
                        {submission.approvedPoints !== null && (
                          <span className="ml-1 font-bold text-emerald-600">
                            / {submission.approvedPoints} approved
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-600">
                        {formatDate(submission.submittedAt)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={submission.status} />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedSubmission(submission)}
                          className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                            submission.status === 'PENDING'
                              ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {submission.status === 'PENDING' ? 'Review' : 'View'}
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'STUDENTS' && (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Student progress</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Only approved points are counted. Click a student to open a printable report.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  placeholder="Search students..."
                  className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <PrintButton label="Print page" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Group I</th>
                  <th className="px-4 py-3 font-semibold">Group II</th>
                  <th className="px-4 py-3 font-semibold">Group III</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Eligibility</th>
                  <th className="px-4 py-3 text-right font-semibold">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-xs text-slate-500">
                      No students found.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="transition hover:bg-slate-50/70">
                      <td className="px-4 py-4">
                        <span className="block text-xs font-bold text-slate-900">{student.name}</span>
                        <span className="mt-0.5 block text-[11px] text-slate-500">
                          {student.registerNo || 'No register no'}
                          {student.branch ? ` · ${student.branch}` : ''}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold text-slate-600">
                        {STUDENT_TYPE_LABELS[student.studentType]}
                      </td>
                      {(['GROUP_1', 'GROUP_2', 'GROUP_3'] as const).map((group) => {
                        const points = student.groupPoints[group]
                        const met = points >= student.targetPerGroup

                        return (
                          <td key={group} className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-bold ${
                                  met ? 'text-emerald-600' : 'text-slate-700'
                                }`}
                              >
                                {points}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                / {student.targetPerGroup}
                              </span>
                            </div>
                            <ProgressBar
                              value={points}
                              max={student.targetPerGroup}
                              tone={met ? 'emerald' : 'indigo'}
                              className="mt-1.5 w-24"
                              label={`${GROUP_LABELS[group]} for ${student.name}`}
                            />
                          </td>
                        )
                      })}
                      <td className="px-4 py-4">
                        <span className="text-sm font-black text-slate-900">
                          {student.totalPoints}
                        </span>
                        <span className="text-[11px] text-slate-400"> / {student.targetTotal}</span>
                      </td>
                      <td className="px-4 py-4">
                        {student.isEligible ? (
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Eligible
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                            Incomplete
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`/admin/students/${student.id}`}
                          className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                        >
                          Open
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selectedSubmission && (
        <ReviewModal
          key={selectedSubmission.id}
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onSuccess={() => {
            setSelectedSubmission(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
