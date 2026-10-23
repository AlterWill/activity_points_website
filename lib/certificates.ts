import { randomUUID } from 'crypto'
import { mkdir, readFile, unlink, writeFile } from 'fs/promises'
import path from 'path'
import type { CertificateExtension } from './certificate-format'
import { deleteNeonObject, isNeonStorageConfigured } from './neon-storage'
import { isUuid } from './validation'
import type { CertificateStorage, CertificateStorageMode } from './types'

export interface CertificateKind {
  ext: 'pdf' | 'png' | 'jpg'
  mime: 'application/pdf' | 'image/png' | 'image/jpeg'
}

export interface SavedCertificate {
  url: string
  storage: CertificateStorage
  key: string
}

export class CertificateStorageUnavailableError extends Error {
  constructor() {
    super(
      'Certificate uploads are disabled because Neon object storage is not configured on this deployment. Run `neon deploy` locally or set the AWS_* environment variables before accepting uploads.'
    )
    this.name = 'CertificateStorageUnavailableError'
  }
}

const STORAGE_ROOT = path.join(process.cwd(), 'storage', 'certificates')
const SAFE_FILE_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|png|jpg)$/i

const MIME_BY_EXT: Record<string, CertificateKind['mime']> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
}

export function detectCertificateKind(buffer: Buffer): CertificateKind | null {
  if (buffer.length < 8) return null

  if (buffer.subarray(0, 5).toString('ascii') === '%PDF-') {
    return { ext: 'pdf', mime: 'application/pdf' }
  }

  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a

  if (isPng) {
    return { ext: 'png', mime: 'image/png' }
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' }
  }

  return null
}

export function certificateUrlFor(studentId: string, fileName: string): string {
  return `/api/certificates/${studentId}/${fileName}`
}

export function certificateKeyFor(studentId: string, fileName: string): string {
  return `certificates/${studentId}/${fileName}`
}

export function parseCertificateKey(key: unknown, studentId: string): string | null {
  if (typeof key !== 'string' || !isUuid(studentId)) return null

  const prefix = `certificates/${studentId}/`
  if (!key.startsWith(prefix)) return null

  const fileName = key.slice(prefix.length)
  if (!SAFE_FILE_NAME.test(fileName)) return null

  return fileName
}

export function createCertificateKey(
  studentId: string,
  extension: CertificateExtension
): { key: string; fileName: string } {
  if (!isUuid(studentId)) throw new Error('Invalid student identifier.')

  const fileName = `${randomUUID()}.${extension}`
  return { key: certificateKeyFor(studentId, fileName), fileName }
}


export function getCertificateStorageMode(): CertificateStorageMode {
  if (isNeonStorageConfigured()) {
    return 'NEON'
  }

  if (process.env.VERCEL) {
    return 'UNCONFIGURED'
  }

  return 'LOCAL'
}

function storageDirectoryFor(studentId: string): string {
  return path.join(STORAGE_ROOT, studentId)
}

export async function saveCertificate(
  studentId: string,
  buffer: Buffer,
  kind: CertificateKind
): Promise<SavedCertificate> {
  if (!isUuid(studentId)) {
    throw new Error('Invalid student identifier.')
  }

  const mode = getCertificateStorageMode()
  if (mode === 'UNCONFIGURED') {
    throw new CertificateStorageUnavailableError()
  }

  if (mode === 'NEON') {
    throw new Error('Neon certificates must be uploaded through a presigned URL.')
  }

  const fileName = `${randomUUID()}.${kind.ext}`
  const directory = storageDirectoryFor(studentId)
  const absolutePath = path.join(directory, fileName)

  await mkdir(directory, { recursive: true, mode: 0o700 })
  await writeFile(absolutePath, buffer, { mode: 0o600, flag: 'wx' })

  return {
    url: certificateUrlFor(studentId, fileName),
    storage: 'LOCAL',
    key: absolutePath,
  }
}

export async function removeCertificate(
  key: string,
  storage: CertificateStorage
): Promise<void> {
  if (storage === 'NEON') {
    await deleteNeonObject(key)
    return
  }

  const resolved = path.resolve(key)
  const root = path.resolve(STORAGE_ROOT)

  if (!resolved.startsWith(`${root}${path.sep}`)) return

  try {
    await unlink(resolved)
  } catch {
    // The file may already be gone. Deleting is best effort.
  }
}

export async function readCertificate(
  studentId: string,
  fileName: string,
  storage: CertificateStorage
): Promise<{ buffer: Buffer; mime: CertificateKind['mime'] } | null> {
  if (!isUuid(studentId) || !SAFE_FILE_NAME.test(fileName)) return null
  if (storage !== 'LOCAL') return null

  const extension = fileName.split('.').pop()?.toLowerCase() ?? ''
  const mime = MIME_BY_EXT[extension]
  if (!mime) return null

  const absolutePath = path.resolve(storageDirectoryFor(studentId), fileName)
  const root = path.resolve(STORAGE_ROOT)

  if (!absolutePath.startsWith(`${root}${path.sep}`)) return null

  try {
    const buffer = await readFile(absolutePath)
    return { buffer, mime }
  } catch {
    return null
  }
}
