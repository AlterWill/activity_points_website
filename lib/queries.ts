import { prisma } from './prisma'
import { getMaxClaimPoints, getStudentTargets, normalizeActivityConfig } from './points'
import type {
  ActivityGroup,
  CategoryDTO,
  StudentProgressDTO,
  StudentReport,
  SubmissionDTO,
} from './types'

const submissionInclude = {
  student: {
    select: {
      id: true,
      name: true,
      registerNo: true,
      branch: true,
    },
  },
  activityHead: {
    select: {
      id: true,
      code: true,
      title: true,
      evidenceRequired: true,
      maxPointsCap: true,
      pointsConfig: true,
    },
  },
} as const

type SubmissionRecord = Awaited<ReturnType<typeof findSubmissions>>[number]

async function findSubmissions(where: { studentId?: string }) {
  return prisma.submission.findMany({
    where,
    include: submissionInclude,
    orderBy: { submittedAt: 'desc' },
  })
}

function submissionKey(studentId: string, activityHeadId: string): string {
  return `${studentId}:${activityHeadId}`
}

function buildApprovedTotals(
  submissions: Array<{
    studentId: string
    activityHeadId: string
    status: string
    approvedPoints: number | null
  }>
): Map<string, number> {
  const totals = new Map<string, number>()

  for (const submission of submissions) {
    if (submission.status !== 'APPROVED') continue
    const key = submissionKey(submission.studentId, submission.activityHeadId)
    totals.set(key, (totals.get(key) ?? 0) + (submission.approvedPoints ?? 0))
  }

  return totals
}

function mapSubmission(
  submission: SubmissionRecord,
  approvedTotals: Map<string, number>
): SubmissionDTO {
  const totalForActivity =
    approvedTotals.get(submissionKey(submission.studentId, submission.activityHeadId)) ?? 0
  const activityApprovedPoints =
    submission.status === 'APPROVED'
      ? Math.max(0, totalForActivity - (submission.approvedPoints ?? 0))
      : totalForActivity

  const pointsConfig = normalizeActivityConfig(submission.activityHead.pointsConfig)

  return {
    id: submission.id,
    studentId: submission.studentId,
    activityHeadId: submission.activityHeadId,
    group: submission.group,
    certificateUrl: submission.certificateUrl,
    level: submission.level,
    selectedOption: submission.selectedOption,
    hoursSpent: submission.hoursSpent,
    claimLabel: submission.claimLabel,
    claimedPoints: submission.claimedPoints,
    approvedPoints: submission.approvedPoints,
    activityApprovedPoints,
    status: submission.status,
    adminRemarks: submission.adminRemarks,
    submittedAt: submission.submittedAt.toISOString(),
    reviewedAt: submission.reviewedAt?.toISOString() ?? null,
    student: submission.student,
    activityHead: {
      id: submission.activityHead.id,
      code: submission.activityHead.code,
      title: submission.activityHead.title,
      evidenceRequired: submission.activityHead.evidenceRequired,
      maxPointsCap: submission.activityHead.maxPointsCap,
      maxClaimPoints: getMaxClaimPoints(pointsConfig),
    },
  }
}

function calculateProgress(
  student: {
    id: string
    name: string
    email: string
    registerNo: string | null
    branch: string | null
    studentType: 'REGULAR' | 'LATERAL_ENTRY' | 'PWD'
  },
  submissions: Array<{ group: ActivityGroup; status: string; approvedPoints: number | null }>
): StudentProgressDTO {
  const groupPoints: Record<ActivityGroup, number> = {
    GROUP_1: 0,
    GROUP_2: 0,
    GROUP_3: 0,
  }

  for (const submission of submissions) {
    if (submission.status !== 'APPROVED') continue
    groupPoints[submission.group] += submission.approvedPoints ?? 0
  }

  const targets = getStudentTargets(student.studentType)
  const totalPoints = groupPoints.GROUP_1 + groupPoints.GROUP_2 + groupPoints.GROUP_3
  const isEligible =
    totalPoints >= targets.total &&
    groupPoints.GROUP_1 >= targets.perGroup &&
    groupPoints.GROUP_2 >= targets.perGroup &&
    groupPoints.GROUP_3 >= targets.perGroup

  return {
    id: student.id,
    name: student.name,
    email: student.email,
    registerNo: student.registerNo,
    branch: student.branch,
    studentType: student.studentType,
    groupPoints,
    totalPoints,
    targetTotal: targets.total,
    targetPerGroup: targets.perGroup,
    isEligible,
  }
}

export async function getCatalog(): Promise<CategoryDTO[]> {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }],
    include: {
      activityHeads: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  return categories.map((category) => ({
    id: category.id,
    code: category.code,
    group: category.group,
    title: category.title,
    maxPointsCap: category.maxPointsCap,
    activities: category.activityHeads.map((activity) => ({
      id: activity.id,
      code: activity.code,
      title: activity.title,
      evidenceRequired: activity.evidenceRequired,
      maxPointsCap: activity.maxPointsCap,
      pointsConfig: normalizeActivityConfig(activity.pointsConfig),
    })),
  }))
}

export async function getStudentSubmissions(studentId: string): Promise<SubmissionDTO[]> {
  const submissions = await findSubmissions({ studentId })
  const approvedTotals = buildApprovedTotals(submissions)
  return submissions.map((submission) => mapSubmission(submission, approvedTotals))
}

export async function getAdminDashboardData(): Promise<{
  submissions: SubmissionDTO[]
  students: StudentProgressDTO[]
}> {
  const [submissions, studentRecords] = await Promise.all([
    findSubmissions({}),
    prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        name: true,
        email: true,
        registerNo: true,
        branch: true,
        studentType: true,
      },
      orderBy: { name: 'asc' },
    }),
  ])

  const approvedTotals = buildApprovedTotals(submissions)
  const mappedSubmissions = submissions.map((submission) => mapSubmission(submission, approvedTotals))

  const submissionsByStudent = new Map<string, SubmissionRecord[]>()
  for (const submission of submissions) {
    const current = submissionsByStudent.get(submission.studentId) ?? []
    current.push(submission)
    submissionsByStudent.set(submission.studentId, current)
  }

  const students = studentRecords.map((student) =>
    calculateProgress(student, submissionsByStudent.get(student.id) ?? [])
  )

  return { submissions: mappedSubmissions, students }
}

export async function getStudentReport(studentId: string): Promise<StudentReport | null> {
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) return null

  const student = await prisma.user.findFirst({
    where: { id: studentId, role: 'STUDENT' },
    select: {
      id: true,
      name: true,
      email: true,
      registerNo: true,
      branch: true,
      studentType: true,
    },
  })

  if (!student) return null

  const submissions = await findSubmissions({ studentId })
  const approvedTotals = buildApprovedTotals(submissions)

  return {
    student: calculateProgress(student, submissions),
    submissions: submissions.map((submission) => mapSubmission(submission, approvedTotals)),
  }
}
