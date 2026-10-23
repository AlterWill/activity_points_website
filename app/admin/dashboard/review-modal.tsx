'use client'

import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileText,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react'
import { reviewSubmissionAction } from '@/app/actions/admin'
import { StatusBadge } from '@/components/status-badge'
import { formatDate, GROUP_LABELS } from '@/lib/format'
import type { SubmissionDTO } from '@/lib/types'

interface ReviewModalProps {
  submission: SubmissionDTO
  onClose: () => void
  onSuccess: () => void
}

export function ReviewModal({ submission, onClose, onSuccess }: ReviewModalProps) {
  const activity = submission.activityHead
  const isPdf = /\.pdf(?:$|\?)/i.test(submission.certificateUrl)

  const cap = activity?.maxPointsCap ?? null
  const remainingActivityPoints =
    cap === null ? null : Math.max(0, cap - submission.activityApprovedPoints)
  const maxApprovePoints = Math.min(
    activity?.maxClaimPoints ?? submission.claimedPoints,
    remainingActivityPoints ?? Number.MAX_SAFE_INTEGER
  )

  const [points, setPoints] = useState(
    Math.max(1, Math.min(submission.claimedPoints, Math.max(1, maxApprovePoints)))
  )
  const [remarks, setRemarks] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPending = submission.status === 'PENDING'
  const canApprove = maxApprovePoints >= 1

  async function handleAction(action: 'APPROVE' | 'REJECT') {
    setError(null)

    if (action === 'REJECT' && !remarks.trim()) {
      setError('Please explain why this certificate is being rejected.')
      return
    }

    if (action === 'APPROVE' && (!Number.isInteger(points) || points < 1)) {
      setError('Approved points must be a whole number greater than zero.')
      return
    }

    setLoading(true)

    try {
      const result = await reviewSubmissionAction({
        submissionId: submission.id,
        action,
        approvedPoints: action === 'APPROVE' ? points : null,
        remarks,
      })

      if (!result.success) {
        setError(result.error || 'Unable to save this review.')
        return
      }

      onSuccess()
    } catch (reviewError) {
      console.error(reviewError)
      setError('Unable to save this review right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="my-4 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Certificate review</h2>
              <StatusBadge status={submission.status} />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {submission.student?.name || 'Unknown student'} ·{' '}
              {submission.student?.registerNo || 'No register no'}
              {submission.student?.branch ? ` · ${submission.student.branch}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
            aria-label="Close review"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 flex items-start rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
            <AlertCircle className="mr-2 mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid flex-1 overflow-hidden md:grid-cols-12">
          <div className="flex min-h-[380px] flex-col border-b border-slate-200 bg-slate-100 p-4 md:col-span-7 md:border-b-0 md:border-r">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center text-xs font-semibold text-slate-600">
                <FileText className="mr-1.5 h-4 w-4 text-indigo-600" />
                {isPdf ? 'PDF certificate' : 'Image certificate'}
              </span>
              <a
                href={submission.certificateUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Open in new tab
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </div>

            {isPdf ? (
              <iframe
                src={submission.certificateUrl}
                title="Certificate PDF"
                className="min-h-[340px] w-full flex-1 rounded-xl border border-slate-300 bg-white"
              />
            ) : (
              <div className="flex flex-1 items-center justify-center overflow-auto rounded-xl border border-slate-300 bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={submission.certificateUrl}
                  alt="Certificate evidence"
                  className="max-h-[520px] max-w-full object-contain"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col overflow-y-auto p-5 md:col-span-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                Activity
              </p>
              <h3 className="mt-1 text-lg font-black leading-tight text-slate-900">
                {activity?.title || 'Unknown activity'}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                  {GROUP_LABELS[submission.group]}
                </span>
                {activity?.code && (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                    {activity.code}
                  </span>
                )}
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                  {submission.claimLabel || 'Claim'}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Student</span>
                <span className="text-right font-semibold text-slate-800">
                  {submission.student?.name || '—'}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Submitted</span>
                <span className="font-semibold text-slate-800">
                  {formatDate(submission.submittedAt)}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Claimed points</span>
                <span className="font-bold text-indigo-700">{submission.claimedPoints} pts</span>
              </div>
              {cap !== null && (
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Activity limit</span>
                  <span className="font-semibold text-slate-800">
                    {submission.activityApprovedPoints} / {cap} already approved
                  </span>
                </div>
              )}
              {submission.reviewedAt && (
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Reviewed</span>
                  <span className="font-semibold text-slate-800">
                    {formatDate(submission.reviewedAt)}
                  </span>
                </div>
              )}
            </div>

            {activity?.evidenceRequired && (
              <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/70 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                  Evidence required
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-indigo-900/80">
                  {activity.evidenceRequired}
                </p>
              </div>
            )}

            {isPending ? (
              <>
                <div className="mt-4">
                  <label
                    htmlFor="approved-points"
                    className="block text-xs font-bold text-slate-700"
                  >
                    Points to approve
                  </label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      id="approved-points"
                      type="number"
                      min={1}
                      max={Math.max(1, maxApprovePoints)}
                      step={1}
                      value={points}
                      onChange={(event) => {
                        const next = Number(event.target.value)
                        setPoints(
                          Number.isFinite(next)
                            ? Math.max(1, Math.min(Math.round(next), Math.max(1, maxApprovePoints)))
                            : 1
                        )
                      }}
                      disabled={!canApprove}
                      className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm font-black text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                    />
                    <span className="text-xs text-slate-500">
                      Maximum allowed: <strong>{Math.max(0, maxApprovePoints)}</strong>
                    </span>
                  </div>
                  {!canApprove && (
                    <p className="mt-1.5 text-xs font-semibold text-red-600">
                      This activity has reached its point limit. It can only be rejected.
                    </p>
                  )}
                  {remainingActivityPoints !== null && canApprove && (
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      {remainingActivityPoints} point(s) remain before this activity reaches its cap.
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <label htmlFor="remarks" className="block text-xs font-bold text-slate-700">
                    Advisor remarks
                  </label>
                  <textarea
                    id="remarks"
                    rows={3}
                    maxLength={2000}
                    value={remarks}
                    onChange={(event) => setRemarks(event.target.value)}
                    placeholder="Required when rejecting. Optional when approving."
                    className="mt-1.5 w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleAction('REJECT')}
                    className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    <XCircle className="mr-1.5 h-4 w-4" />
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={loading || !canApprove}
                    onClick={() => handleAction('APPROVE')}
                    className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    {loading ? 'Saving...' : `Approve ${points || 0} pts`}
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      This certificate was{' '}
                      {submission.status === 'APPROVED' ? 'approved' : 'rejected'}.
                    </p>
                    <p className="mt-1 text-[11px] text-slate-600">
                      {submission.status === 'APPROVED'
                        ? `${submission.approvedPoints ?? 0} points were awarded.`
                        : 'No points were awarded.'}
                    </p>
                    {submission.adminRemarks && (
                      <p className="mt-2 rounded-lg bg-slate-50 p-2.5 text-[11px] leading-relaxed text-slate-700">
                        {submission.adminRemarks}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
