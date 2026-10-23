'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { gzipSync } from 'node:zlib'
import { getCurrentUser } from '@/lib/auth'
import {
  CertificateStorageUnavailableError,
  certificateUrlFor,
  createCertificateKey,
  detectCertificateKind,
  getCertificateStorageMode,
  parseCertificateKey,
  removeCertificate,
  saveCertificate,
  type SavedCertificate,
} from '@/lib/certificates'
import {
  certificateExtensionForFileName,
  certificateMimeForFileName,
} from '@/lib/certificate-format'
import { MAX_PENDING_SUBMISSIONS } from '@/lib/constants'
import { formatBytes } from '@/lib/format'
import {
  createNeonUploadUrl,
  deleteNeonObject,
  headNeonObject,
  putNeonObject,
  readNeonObject,
  readNeonObjectPrefix,
} from '@/lib/neon-storage'
import { calculateClaim, normalizeActivityConfig } from '@/lib/points'
import { prisma } from '@/lib/prisma'
import {
  CertificateStorageQuotaError,
  getCertificateMaxBytesForKind,
  getCertificateMaxMbForKind,
  getCertificateStorageLimitBytes,
  getCertificateStorageUsage,
  getCertificateStorageUsedBytes,
} from '@/lib/storage'
import { isUuid, normalizeShortText } from '@/lib/validation'
import type { AchievementLevel, CertificateEncoding } from '@/lib/types'

const NEON_UPLOAD_TTL_MS = 15 * 60 * 1000

class CertificateUploadExpiredError extends Error {
  constructor() {
    super('This upload link has expired. Please choose the certificate again.')
    this.name = 'CertificateUploadExpiredError'
  }
}

function certificateSizeError(kind: 'pdf' | 'png' | 'jpg'): string {
  const maxMb = getCertificateMaxMbForKind(kind)
  return kind === 'pdf'
    ? `PDF certificates must be ${maxMb} MB or smaller.`
    : `PNG/JPG certificates must be ${maxMb} MB or smaller.`
}

export interface CreateSubmissionResult {
  success?: boolean
  error?: string
  submissionId?: string
  points?: number
}

export interface CreateNeonUploadResult {
  uploadUrl?: string
  key?: string
  contentType?: string
  error?: string
}

export interface CancelNeonUploadResult {
  success?: boolean
  error?: string
}

export async function createNeonUploadAction(input: {
  fileName: string
  size: number
}): Promise<CreateNeonUploadResult> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'STUDENT') {
    return { error: 'You must be signed in as a student to upload a certificate.' }
  }

  if (getCertificateStorageMode() !== 'NEON') {
    return { error: 'Neon object storage is not configured.' }
  }

  const fileName = typeof input?.fileName === 'string' ? input.fileName : ''
  const size = typeof input?.size === 'number' ? input.size : Number.NaN
  const extension =
    fileName.length > 0 && fileName.length <= 255
      ? certificateExtensionForFileName(fileName)
      : null

  if (!extension || !Number.isInteger(size) || size <= 0) {
    return { error: 'Choose a valid PDF, PNG, or JPG certificate.' }
  }

  if (size > getCertificateMaxBytesForKind(extension)) {
    return { error: certificateSizeError(extension) }
  }

  const contentType = certificateMimeForFileName(fileName)
  if (!contentType) {
    return { error: 'Choose a valid PDF, PNG, or JPG certificate.' }
  }

  const pendingCount = await prisma.submission.count({
    where: { studentId: user.id, status: 'PENDING' },
  })

  if (pendingCount >= MAX_PENDING_SUBMISSIONS) {
    return {
      error:
        `You already have ${MAX_PENDING_SUBMISSIONS} submissions waiting for verification. Please wait for your advisor to review them before adding more.`,
    }
  }

  const { key } = createCertificateKey(user.id, extension)

  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('ktu_certificate_storage_quota')::bigint)`
        await tx.certificateUpload.deleteMany({
          where: { expiresAt: { lte: new Date() } },
        })

        const usedBytes = await getCertificateStorageUsedBytes(tx)
        const remainingBytes = Math.max(
          0,
          getCertificateStorageLimitBytes() - usedBytes
        )

        if (size > remainingBytes) {
          throw new CertificateStorageQuotaError(remainingBytes)
        }

        await tx.certificateUpload.create({
          data: {
            studentId: user.id,
            key,
            size,
            expiresAt: new Date(Date.now() + NEON_UPLOAD_TTL_MS),
          },
        })
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    )

    const uploadUrl = await createNeonUploadUrl(key, contentType)
    return { uploadUrl, key, contentType }
  } catch (error) {
    await prisma.certificateUpload.deleteMany({
      where: { key, studentId: user.id },
    })

    if (error instanceof CertificateStorageQuotaError) {
      return {
        error:
          `Not enough certificate storage. ${formatBytes(error.remainingBytes)} remains, but this certificate is ${formatBytes(size)}. Contact your faculty advisor to free up storage.`,
      }
    }

    console.error('Certificate upload preparation failed:', error)
    return { error: 'Unable to prepare the certificate upload right now. Please try again.' }
  }
}

export async function cancelNeonUploadAction(key: string): Promise<CancelNeonUploadResult> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'STUDENT') {
    return { error: 'You must be signed in as a student to cancel an upload.' }
  }

  if (getCertificateStorageMode() !== 'NEON') {
    return { error: 'Neon object storage is not configured.' }
  }

  if (!parseCertificateKey(key, user.id)) {
    return { error: 'Invalid certificate upload.' }
  }

  try {
    await deleteNeonObject(key)
    await prisma.certificateUpload.deleteMany({
      where: { key, studentId: user.id },
    })
    return { success: true }
  } catch (error) {
    console.error('Certificate upload cleanup failed:', error)
    return { error: 'Unable to cancel this certificate upload.' }
  }
}

export async function createSubmissionAction(
  formData: FormData
): Promise<CreateSubmissionResult> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'STUDENT') {
    return { error: 'You must be signed in as a student to submit a certificate.' }
  }

  const activityHeadId = formData.get('activityHeadId')
  const levelValue = formData.get('level')
  const selectedOption = normalizeShortText(formData.get('selectedOption'), 160)
  const hoursValue = formData.get('hoursSpent')
  const certificateKeyValue = formData.get('certificateKey')
  const certificateEntry = formData.get('certificate')
  const certificate = certificateEntry instanceof File ? certificateEntry : null
  const neonKey =
    typeof certificateKeyValue === 'string' &&
    certificateKeyValue.length > 0 &&
    certificateKeyValue.length <= 512
      ? certificateKeyValue
      : null

  if (!isUuid(activityHeadId)) {
    return { error: 'Select a valid activity.' }
  }

  if (neonKey) {
    if (getCertificateStorageMode() !== 'NEON') {
      return { error: 'Neon object storage is not configured.' }
    }

    if (!parseCertificateKey(neonKey, user.id)) {
      return { error: 'Invalid certificate upload.' }
    }
  } else if (!certificate) {
    return { error: 'Attach a certificate file.' }
  }

  if (certificate && certificate.size <= 0) {
    return { error: 'The selected certificate file is empty.' }
  }

  let hoursSpent: number | null = null
  if (typeof hoursValue === 'string' && hoursValue.trim() !== '') {
    const parsedHours = Number(hoursValue)
    if (!Number.isInteger(parsedHours)) {
      return { error: 'Enter a whole number of completed hours.' }
    }
    hoursSpent = parsedHours
  }

  let savedCertificate: SavedCertificate | null = null
  let cleanupNeonKey: string | null = null

  try {
    const activity = await prisma.activityHead.findFirst({
      where: {
        id: activityHeadId,
        isActive: true,
        category: { isActive: true },
      },
      include: {
        category: {
          select: { group: true },
        },
      },
    })

    if (!activity) {
      return { error: 'This activity is no longer available. Refresh the page and try again.' }
    }

    const config = normalizeActivityConfig(activity.pointsConfig)
    const level = typeof levelValue === 'string' ? levelValue.trim().toUpperCase() : null

    const claim = calculateClaim(config, {
      level,
      selectedOption,
      hoursSpent,
    })

    if ('error' in claim) {
      return { error: claim.error }
    }

    const pendingCount = await prisma.submission.count({
      where: { studentId: user.id, status: 'PENDING' },
    })

    if (pendingCount >= MAX_PENDING_SUBMISSIONS) {
      return {
        error:
          `You already have ${MAX_PENDING_SUBMISSIONS} submissions waiting for verification. Please wait for your advisor to review them before adding more.`,
      }
    }

    let certificateSize = 0
    let certificateEncoding: CertificateEncoding = 'IDENTITY'

    if (neonKey) {
      cleanupNeonKey = neonKey

      const fileName = parseCertificateKey(neonKey, user.id)
      if (!fileName) {
        return { error: 'Invalid certificate upload.' }
      }

      const reservation = await prisma.certificateUpload.findFirst({
        where: {
          key: neonKey,
          studentId: user.id,
          expiresAt: { gt: new Date() },
        },
        select: { id: true, size: true },
      })

      if (!reservation) {
        throw new CertificateUploadExpiredError()
      }

      const head = await headNeonObject(neonKey)
      if (!head || head.size <= 0) {
        return { error: 'The uploaded certificate could not be found. Please try again.' }
      }

      if (head.size > reservation.size) {
        return { error: 'The uploaded certificate is larger than the reserved upload.' }
      }

      const prefix = await readNeonObjectPrefix(neonKey, 8)
      const kind = detectCertificateKind(prefix)
      const extension = fileName.split('.').pop()?.toLowerCase()

      if (!kind || kind.ext !== extension) {
        return { error: 'The file is not a valid PDF, PNG, or JPG certificate.' }
      }

      if (head.size > getCertificateMaxBytesForKind(kind.ext)) {
        return { error: certificateSizeError(kind.ext) }
      }

      certificateSize = head.size

      if (kind.ext === 'pdf') {
        const original = await readNeonObject(neonKey)
        if (original.length !== head.size) {
          throw new Error('The uploaded certificate changed during processing.')
        }

        const compressed = gzipSync(original, { level: 9 })
        if (compressed.length < original.length) {
          await putNeonObject(neonKey, compressed, kind.mime, 'gzip')
          certificateSize = compressed.length
          certificateEncoding = 'GZIP'
        }
      }

      savedCertificate = {
        url: certificateUrlFor(user.id, fileName),
        storage: 'NEON',
        key: neonKey,
      }
    } else if (certificate) {
      const buffer = Buffer.from(await certificate.arrayBuffer())
      const kind = detectCertificateKind(buffer)

      if (!kind) {
        return { error: 'The file is not a valid PDF, PNG, or JPG certificate.' }
      }

      if (buffer.length > getCertificateMaxBytesForKind(kind.ext)) {
        return { error: certificateSizeError(kind.ext) }
      }

      const storageUsage = await getCertificateStorageUsage()

      if (!storageUsage.isConfigured) {
        return {
          error:
            'Certificate uploads are temporarily unavailable because Neon object storage is not configured. Please contact your faculty advisor.',
        }
      }

      if (buffer.length > storageUsage.remainingBytes) {
        return {
          error:
            `Not enough certificate storage. ${formatBytes(storageUsage.remainingBytes)} remains, but this certificate is ${formatBytes(buffer.length)}. Contact your faculty advisor to free up storage.`,
        }
      }

      savedCertificate = await saveCertificate(user.id, buffer, kind)
      certificateSize = buffer.length

      const latestStorageUsage = await getCertificateStorageUsage()
      if (certificateSize > latestStorageUsage.remainingBytes) {
        await removeCertificate(savedCertificate.key, savedCertificate.storage)
        savedCertificate = null

        return {
          error:
            `Not enough certificate storage. Another upload used the remaining space. Only ${formatBytes(latestStorageUsage.remainingBytes)} remains for new certificates.`,
        }
      }
    } else {
      return { error: 'Attach a certificate file.' }
    }

    if (!savedCertificate) {
      return { error: 'Unable to store the certificate. Please try again.' }
    }

    const submissionData = {
      studentId: user.id,
      activityHeadId: activity.id,
      group: activity.category.group,
      certificateUrl: savedCertificate.url,
      certificateStorage: savedCertificate.storage,
      certificateEncoding,
      certificateSize,
      level: claim.mode === 'LEVEL' ? (level as AchievementLevel) : null,
      selectedOption: claim.mode === 'OPTION' ? selectedOption : null,
      hoursSpent: claim.mode === 'HOURLY' ? hoursSpent : null,
      claimLabel: claim.label,
      claimedPoints: claim.points,
      status: 'PENDING' as const,
    }

    let submission: { id: string } | null = null

    if (neonKey) {
      submission = await prisma.$transaction(
        async (tx) => {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('ktu_certificate_storage_quota')::bigint)`

          const reservation = await tx.certificateUpload.findUnique({
            where: { key: neonKey },
            select: { id: true, studentId: true, expiresAt: true },
          })

          if (
            !reservation ||
            reservation.studentId !== user.id ||
            reservation.expiresAt <= new Date()
          ) {
            throw new CertificateUploadExpiredError()
          }

          await tx.certificateUpload.delete({ where: { id: reservation.id } })

          const usedBytes = await getCertificateStorageUsedBytes(tx)
          const remainingBytes = Math.max(
            0,
            getCertificateStorageLimitBytes() - usedBytes
          )

          if (certificateSize > remainingBytes) {
            throw new CertificateStorageQuotaError(remainingBytes)
          }

          return tx.submission.create({
            data: submissionData,
            select: { id: true },
          })
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      )
    } else {
      submission = await prisma.submission.create({
        data: submissionData,
        select: { id: true },
      })
    }

    if (!submission) {
      throw new Error('Submission was not created.')
    }

    savedCertificate = null
    cleanupNeonKey = null

    try {
      revalidatePath('/dashboard')
      revalidatePath('/admin/dashboard')
      revalidatePath('/admin/students', 'layout')
    } catch (revalidationError) {
      console.error('Failed to revalidate submission paths:', revalidationError)
    }

    return {
      success: true,
      submissionId: submission.id,
      points: claim.points,
    }
  } catch (error) {
    if (savedCertificate) {
      await removeCertificate(savedCertificate.key, savedCertificate.storage)
    }

    if (cleanupNeonKey) {
      await deleteNeonObject(cleanupNeonKey)
      await prisma.certificateUpload.deleteMany({
        where: { key: cleanupNeonKey, studentId: user.id },
      })
    }

    if (error instanceof CertificateStorageUnavailableError) {
      return { error: error.message }
    }

    if (error instanceof CertificateUploadExpiredError) {
      return { error: error.message }
    }

    if (error instanceof CertificateStorageQuotaError) {
      return {
        error:
          `Not enough certificate storage. Only ${formatBytes(error.remainingBytes)} remains for new certificates.`,
      }
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { error: 'This certificate has already been submitted.' }
    }

    console.error('Certificate submission failed:', error)
    return { error: 'Unable to submit the certificate right now. Please try again.' }
  }
}
