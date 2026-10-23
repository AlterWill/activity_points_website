'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { getMaxClaimPoints, normalizeActivityConfig } from '@/lib/points'
import { prisma } from '@/lib/prisma'
import { isUuid, normalizeShortText } from '@/lib/validation'
import type { SubmissionStatus } from '@/lib/types'

class ReviewError extends Error {}

export interface ReviewSubmissionInput {
  submissionId: string
  action: 'APPROVE' | 'REJECT'
  approvedPoints?: number | null
  remarks?: string | null
}

export interface ReviewSubmissionResult {
  success?: boolean
  error?: string
  status?: SubmissionStatus
}

export async function reviewSubmissionAction(
  input: ReviewSubmissionInput
): Promise<ReviewSubmissionResult> {
  const admin = await getCurrentUser()

  if (!admin || admin.role !== 'ADMIN') {
    return { error: 'Only a faculty advisor can review submissions.' }
  }

  if (!isUuid(input.submissionId)) {
    return { error: 'Invalid submission.' }
  }

  if (input.action !== 'APPROVE' && input.action !== 'REJECT') {
    return { error: 'Invalid review action.' }
  }

  const remarks = normalizeShortText(input.remarks, 2000)

  if (input.action === 'REJECT' && !remarks) {
    return { error: 'A remark is required when rejecting a submission.' }
  }

  const approvedPoints = input.action === 'APPROVE' ? input.approvedPoints : 0

  if (input.action === 'APPROVE') {
    if (
      typeof approvedPoints !== 'number' ||
      !Number.isInteger(approvedPoints) ||
      approvedPoints < 1
    ) {
      return { error: 'Approved points must be a whole number greater than zero.' }
    }
  }

  const pointsToApprove = approvedPoints as number

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const submission = await tx.submission.findUnique({
          where: { id: input.submissionId },
          include: {
            activityHead: {
              select: {
                id: true,
                maxPointsCap: true,
                pointsConfig: true,
              },
            },
          },
        })

        if (!submission) {
          throw new ReviewError('This submission no longer exists.')
        }

        if (submission.status !== 'PENDING') {
          throw new ReviewError('This submission has already been reviewed.')
        }

        if (input.action === 'REJECT') {
          const updated = await tx.submission.updateMany({
            where: { id: submission.id, status: 'PENDING' },
            data: {
              status: 'REJECTED',
              approvedPoints: 0,
              adminRemarks: remarks,
              reviewedAt: new Date(),
            },
          })

          if (updated.count !== 1) {
            throw new ReviewError('This submission was just reviewed by someone else.')
          }

          return { status: 'REJECTED' as const }
        }

        const config = normalizeActivityConfig(submission.activityHead.pointsConfig)
        const maxClaimPoints = getMaxClaimPoints(config)

        if (pointsToApprove > maxClaimPoints) {
          throw new ReviewError(
            `Approved points cannot exceed ${maxClaimPoints} for this activity.`
          )
        }

        const cap = submission.activityHead.maxPointsCap

        if (cap !== null) {
          const approvedAggregate = await tx.submission.aggregate({
            where: {
              studentId: submission.studentId,
              activityHeadId: submission.activityHeadId,
              status: 'APPROVED',
              id: { not: submission.id },
            },
            _sum: { approvedPoints: true },
          })

          const alreadyApproved = approvedAggregate._sum.approvedPoints ?? 0
          const remaining = Math.max(0, cap - alreadyApproved)

          if (pointsToApprove > remaining) {
            throw new ReviewError(
              remaining === 0
                ? `This activity has already reached its ${cap}-point limit.`
                : `Only ${remaining} more point(s) can be approved for this activity (limit ${cap}).`
            )
          }
        }

        const updated = await tx.submission.updateMany({
          where: { id: submission.id, status: 'PENDING' },
          data: {
            status: 'APPROVED',
            approvedPoints: pointsToApprove,
            adminRemarks: remarks || null,
            reviewedAt: new Date(),
          },
        })

        if (updated.count !== 1) {
          throw new ReviewError('This submission was just reviewed by someone else.')
        }

        return { status: 'APPROVED' as const }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    )

    revalidatePath('/dashboard')
    revalidatePath('/admin/dashboard')

    return { success: true, status: result.status }
  } catch (error) {
    if (error instanceof ReviewError) {
      return { error: error.message }
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      return { error: 'Another review changed this record. Refresh the page and try again.' }
    }

    console.error('Submission review failed:', error)
    return { error: 'Unable to save this review right now. Please try again.' }
  }
}
