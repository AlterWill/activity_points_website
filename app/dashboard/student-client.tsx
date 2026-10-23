'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Award,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Cpu,
  PlusCircle,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { ProgressBar } from '@/components/progress-bar'
import { PointsRing } from '@/components/points-ring'
import { GROUP_DESCRIPTIONS, GROUP_LABELS, STUDENT_TYPE_LABELS } from '@/lib/format'
import { getStudentTargets } from '@/lib/points'
import type {
  ActivityGroup,
  CategoryDTO,
  CertificateStorageUsage,
  CurrentUser,
  SubmissionDTO,
} from '@/lib/types'
import { SubmissionsTable } from './submissions-table'
import { UploadModal } from './upload-modal'

interface StudentDashboardClientProps {
  user: CurrentUser
  categories: CategoryDTO[]
  submissions: SubmissionDTO[]
  storage: CertificateStorageUsage
}

const GROUP_CARDS: Array<{
  group: ActivityGroup
  icon: typeof Trophy
  accent: string
  iconClass: string
  barTone: 'indigo' | 'sky' | 'emerald'
}> = [
  {
    group: 'GROUP_1',
    icon: Trophy,
    accent: 'from-indigo-500 to-indigo-600',
    iconClass: 'bg-indigo-50 text-indigo-600',
    barTone: 'indigo',
  },
  {
    group: 'GROUP_2',
    icon: Cpu,
    accent: 'from-sky-500 to-sky-600',
    iconClass: 'bg-sky-50 text-sky-600',
    barTone: 'sky',
  },
  {
    group: 'GROUP_3',
    icon: BriefcaseBusiness,
    accent: 'from-emerald-500 to-emerald-600',
    iconClass: 'bg-emerald-50 text-emerald-600',
    barTone: 'emerald',
  },
]

export function StudentDashboardClient({
  user,
  categories,
  submissions,
  storage,
}: StudentDashboardClientProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const targets = getStudentTargets(user.studentType)
  const approvedSubmissions = submissions.filter((submission) => submission.status === 'APPROVED')
  const pendingSubmissions = submissions.filter((submission) => submission.status === 'PENDING')

  const groupPoints: Record<ActivityGroup, number> = {
    GROUP_1: 0,
    GROUP_2: 0,
    GROUP_3: 0,
  }

  const pendingGroupPoints: Record<ActivityGroup, number> = {
    GROUP_1: 0,
    GROUP_2: 0,
    GROUP_3: 0,
  }

  for (const submission of approvedSubmissions) {
    groupPoints[submission.group] += submission.approvedPoints ?? 0
  }

  for (const submission of pendingSubmissions) {
    pendingGroupPoints[submission.group] += submission.claimedPoints
  }

  const totalPoints = groupPoints.GROUP_1 + groupPoints.GROUP_2 + groupPoints.GROUP_3
  const pendingPoints =
    pendingGroupPoints.GROUP_1 + pendingGroupPoints.GROUP_2 + pendingGroupPoints.GROUP_3

  const completedGroups = GROUP_CARDS.filter(
    ({ group }) => groupPoints[group] >= targets.perGroup
  ).length

  const isEligible = totalPoints >= targets.total && completedGroups === 3
  const remainingTotal = Math.max(0, targets.total - totalPoints)
  const missingGroups = GROUP_CARDS.filter(
    ({ group }) => groupPoints[group] < targets.perGroup
  )

  function handleSuccess(points?: number) {
    setIsModalOpen(false)
    setNotice(
      points
        ? `Certificate submitted. Your advisor will verify the ${points} claimed point${points === 1 ? '' : 's'}.`
        : 'Certificate submitted. Your advisor will verify it shortly.'
    )
    router.refresh()
    window.setTimeout(() => setNotice(null), 7000)
  }

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                Student portal
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                {STUDENT_TYPE_LABELS[user.studentType]}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Welcome back, {user.name.split(' ')[0]}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {user.registerNo || 'Register number not set'}
              <span className="mx-2 text-slate-300">•</span>
              {user.branch || 'Branch not set'}
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            {pendingSubmissions.length > 0 && (
              <span className="inline-flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                <Clock3 className="mr-1.5 h-4 w-4" />
                {pendingSubmissions.length} awaiting review
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Submit certificate
            </button>
          </div>
        </div>
      </header>

      {storage.warning && (
        <div
          className={`flex items-start rounded-2xl border px-4 py-3 text-sm ${
            storage.isConfigured
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          <AlertTriangle className="mr-2 mt-0.5 h-4 w-4 shrink-0" />
          <span>{storage.warning}</span>
        </div>
      )}

      {notice && (
        <div className="flex items-start rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="mr-2 mt-0.5 h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <section className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 text-white shadow-lg shadow-indigo-950/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-300">
                Total progress
              </p>
              <h2 className="mt-1 text-lg font-bold">Graduation requirement</h2>
            </div>
            <Award className="h-5 w-5 text-indigo-300" />
          </div>

          <div className="mt-6 flex justify-center">
            <PointsRing value={totalPoints} max={targets.total} />
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            {isEligible ? (
              <div className="flex items-start text-sm font-semibold text-emerald-300">
                <CheckCircle2 className="mr-2 mt-0.5 h-4 w-4 shrink-0" />
                All KTU 2024 point requirements are met.
              </div>
            ) : (
              <div className="flex items-start text-sm font-semibold text-amber-200">
                <AlertTriangle className="mr-2 mt-0.5 h-4 w-4 shrink-0" />
                {remainingTotal > 0
                  ? `${remainingTotal} more total points needed.`
                  : 'Complete the minimum in each group to qualify.'}
              </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-white/5 px-3 py-2">
                <span className="block text-slate-400">Pending review</span>
                <span className="mt-0.5 block font-bold text-amber-300">{pendingPoints} pts</span>
              </div>
              <div className="rounded-xl bg-white/5 px-3 py-2">
                <span className="block text-slate-400">Groups completed</span>
                <span className="mt-0.5 block font-bold text-indigo-200">
                  {completedGroups} of 3
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-3 lg:col-span-2">
          {GROUP_CARDS.map(({ group, icon: Icon, accent, iconClass, barTone }) => {
            const points = groupPoints[group]
            const isMet = points >= targets.perGroup
            const remaining = Math.max(0, targets.perGroup - points)

            return (
              <article
                key={group}
                className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className={`h-1.5 w-10 rounded-full bg-gradient-to-r ${accent}`} />
                <div className="mt-4 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {GROUP_LABELS[group]}
                    </p>
                    <h3 className="mt-1 text-sm font-bold text-slate-900">
                      {isMet ? 'Minimum reached' : `${remaining} points to go`}
                    </h3>
                  </div>
                  <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${iconClass}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black tracking-tight text-slate-900">{points}</span>
                  <span className="text-xs font-semibold text-slate-400">/ {targets.perGroup} pts</span>
                </div>
                <ProgressBar
                  value={points}
                  max={targets.perGroup}
                  tone={isMet ? 'emerald' : barTone}
                  className="mt-3"
                  label={`${GROUP_LABELS[group]} progress`}
                />
                <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                  {GROUP_DESCRIPTIONS[group]}
                </p>
                {pendingGroupPoints[group] > 0 && (
                  <p className="mt-auto pt-3 text-[11px] font-semibold text-amber-600">
                    +{pendingGroupPoints[group]} pts pending verification
                  </p>
                )}
              </article>
            )
          })}
        </div>
      </section>

      {missingGroups.length > 0 && (
        <section className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
            <div>
              <h2 className="text-sm font-bold text-indigo-950">What to do next</h2>
              <p className="mt-1 text-sm text-indigo-900/80">
                Submit certificates for{' '}
                {missingGroups.map(({ group }) => GROUP_LABELS[group]).join(', ')} to reach the minimum
                of {targets.perGroup} points in every group.
              </p>
            </div>
          </div>
        </section>
      )}

      <SubmissionsTable submissions={submissions} />

      {isModalOpen && (
        <UploadModal
          categories={categories}
          storage={storage}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
