import type { Prisma } from '@prisma/client'
import { getCertificateStorageMode } from './certificates'
import {
  MAX_IMAGE_CERTIFICATE_MB,
  MAX_PDF_CERTIFICATE_MB,
} from './constants'
import { formatBytes } from './format'
import { prisma } from './prisma'
import type { CertificateStorageUsage } from './types'

const DEFAULT_STORAGE_LIMIT_MB = 900
const DEFAULT_NEON_STORAGE_LIMIT_MB = 9000

type StorageClient = typeof prisma | Prisma.TransactionClient

export class CertificateStorageQuotaError extends Error {
  constructor(public readonly remainingBytes: number) {
    super('Not enough certificate storage.')
    this.name = 'CertificateStorageQuotaError'
  }
}

export function getCertificateMaxMbForKind(kind: 'pdf' | 'png' | 'jpg'): number {
  return kind === 'pdf' ? MAX_PDF_CERTIFICATE_MB : MAX_IMAGE_CERTIFICATE_MB
}

export function getCertificateMaxBytesForKind(kind: 'pdf' | 'png' | 'jpg'): number {
  return getCertificateMaxMbForKind(kind) * 1024 * 1024
}

export function getCertificateStorageLimitBytes(): number {
  const rawValue = process.env.CERTIFICATE_STORAGE_LIMIT_MB
  const parsedValue = rawValue ? Number(rawValue) : Number.NaN
  const defaultLimitMb =
    getCertificateStorageMode() === 'NEON'
      ? DEFAULT_NEON_STORAGE_LIMIT_MB
      : DEFAULT_STORAGE_LIMIT_MB
  const limitMb =
    Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : defaultLimitMb

  return Math.floor(limitMb * 1024 * 1024)
}

export async function getCertificateStorageUsedBytes(
  client: StorageClient = prisma
): Promise<number> {
  const [submissionAggregate, uploadAggregate] = await Promise.all([
    client.submission.aggregate({
      _sum: { certificateSize: true },
    }),
    client.certificateUpload.aggregate({
      where: { expiresAt: { gt: new Date() } },
      _sum: { size: true },
    }),
  ])

  return (
    (submissionAggregate._sum.certificateSize ?? 0) +
    (uploadAggregate._sum.size ?? 0)
  )
}

export async function getCertificateStorageUsage(): Promise<CertificateStorageUsage> {
  const usedBytes = await getCertificateStorageUsedBytes()
  const limitBytes = getCertificateStorageLimitBytes()
  const remainingBytes = Math.max(0, limitBytes - usedBytes)
  const percent =
    limitBytes > 0 ? Math.min(100, Math.round((usedBytes / limitBytes) * 100)) : 100
  const mode = getCertificateStorageMode()

  let warning: string | null = null

  if (mode === 'UNCONFIGURED') {
    warning =
      'Certificate uploads are disabled because Neon object storage is not configured. Run `neon deploy` locally or set the AWS_* environment variables before accepting uploads.'
  } else if (remainingBytes <= 0) {
    warning = `Certificate storage is full (${formatBytes(usedBytes)} used). New uploads will be blocked until storage is expanded or old submissions are removed.`
  } else if (percent >= 90) {
    warning = `Certificate storage is almost full (${percent}% used). Only ${formatBytes(remainingBytes)} remains for new certificates.`
  }

  return {
    usedBytes,
    limitBytes,
    remainingBytes,
    percent,
    mode,
    isConfigured: mode !== 'UNCONFIGURED',
    maxPdfBytes: MAX_PDF_CERTIFICATE_MB * 1024 * 1024,
    maxPdfMb: MAX_PDF_CERTIFICATE_MB,
    maxImageBytes: MAX_IMAGE_CERTIFICATE_MB * 1024 * 1024,
    maxImageMb: MAX_IMAGE_CERTIFICATE_MB,
    warning,
  }
}
