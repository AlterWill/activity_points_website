'use client'

import { useState } from 'react'
import { ExternalLink, FileText, MessageSquare } from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import { formatDate, GROUP_LABELS } from '@/lib/format'
import type { SubmissionDTO, SubmissionStatus } from '@/lib/types'

interface SubmissionsTableProps {
  submissions: SubmissionDTO[]
}

type Filter = 'ALL' | SubmissionStatus

const FILTERS: Filter[] = ['ALL', 'PENDING', 'APPROVED', 'REJECTED']

export function SubmissionsTable({ submissions }: SubmissionsTableProps) {
  const [filter, setFilter] = useState<Filter>('ALL')
  const [selectedRemark, setSelectedRemark] = useState<string | null>(null)

  const filtered = submissions.filter((submission) =>
    filter === 'ALL' ? true : submission.status === filter
  )

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">My submissions</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Track your certificates, claimed points and advisor feedback.
          </p>
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
                onClick={() => setFilter(option)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                  filter === option
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
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Activity</th>
              <th className="px-4 py-3 font-semibold">Group</th>
              <th className="px-4 py-3 font-semibold">Claim</th>
              <th className="px-4 py-3 font-semibold">Points</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Certificate</th>
              <th className="px-4 py-3 font-semibold">Advisor remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <FileText className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-700">No submissions yet</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Use “Submit certificate” to add your first activity claim.
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((submission) => (
                <tr key={submission.id} className="transition hover:bg-slate-50/70">
                  <td className="px-4 py-4">
                    <span className="block text-xs font-semibold text-slate-900">
                      {submission.activityHead?.title || 'Activity'}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-slate-400">
                      {submission.activityHead?.code ? `${submission.activityHead.code} · ` : ''}
                      Submitted {formatDate(submission.submittedAt)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                      {GROUP_LABELS[submission.group]}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="block text-xs text-slate-700">
                      {submission.claimLabel || submission.selectedOption || submission.level || '—'}
                    </span>
                    {submission.hoursSpent !== null && (
                      <span className="mt-0.5 block text-[11px] text-slate-400">
                        {submission.hoursSpent} hours
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-xs">
                      <span className="font-semibold text-slate-700">
                        {submission.claimedPoints} claimed
                      </span>
                      <span className="mx-1 text-slate-300">/</span>
                      <span
                        className={`font-bold ${
                          submission.status === 'APPROVED' ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      >
                        {submission.approvedPoints !== null
                          ? `${submission.approvedPoints} approved`
                          : 'Awaiting review'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={submission.status} />
                  </td>
                  <td className="px-4 py-4">
                    <a
                      href={submission.certificateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      <FileText className="mr-1 h-3.5 w-3.5" />
                      View
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </td>
                  <td className="px-4 py-4">
                    {submission.adminRemarks ? (
                      <button
                        type="button"
                        onClick={() => setSelectedRemark(submission.adminRemarks)}
                        className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 transition hover:bg-slate-200"
                      >
                        <MessageSquare className="mr-1 h-3.5 w-3.5 text-slate-500" />
                        <span className="max-w-[140px] truncate">{submission.adminRemarks}</span>
                      </button>
                    ) : (
                      <span className="text-xs italic text-slate-400">None</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedRemark && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="flex items-center text-sm font-bold text-slate-900">
              <MessageSquare className="mr-2 h-4 w-4 text-indigo-600" />
              Advisor remarks
            </h3>
            <p className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
              {selectedRemark}
            </p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRemark(null)}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
