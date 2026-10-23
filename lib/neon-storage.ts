import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { certificateMimeForFileName } from './certificate-format'
import type { CertificateEncoding } from './types'

const NEON_STORAGE_BUCKET = process.env.NEON_STORAGE_BUCKET || 'assets'

let client: S3Client | null = null

function getClient(): S3Client {
  if (!isNeonStorageConfigured()) {
    throw new Error('Neon object storage is not configured.')
  }

  if (!client) {
    // Neon uses path-style addressing. The AWS SDK reads the endpoint,
    // region, and credentials injected by `neon deploy` from the AWS_* env.
    client = new S3Client({ forcePathStyle: true })
  }

  return client
}

function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const candidate = error as {
    name?: string
    $metadata?: { httpStatusCode?: number }
  }

  return (
    candidate.name === 'NotFound' ||
    candidate.name === 'NoSuchKey' ||
    candidate.$metadata?.httpStatusCode === 404
  )
}

export function isNeonStorageConfigured(): boolean {
  return Boolean(
    process.env.AWS_ENDPOINT_URL_S3 &&
      process.env.AWS_REGION &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY
  )
}

export async function createNeonUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 900
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: NEON_STORAGE_BUCKET,
    Key: key,
    ContentType: contentType,
  })

  return getSignedUrl(getClient(), command, { expiresIn: expiresInSeconds })
}

export async function createNeonDownloadUrl(
  key: string,
  fileName: string,
  encoding: CertificateEncoding = 'IDENTITY',
  expiresInSeconds = 300
): Promise<string | null> {
  const mime = certificateMimeForFileName(fileName)
  const extension = fileName.split('.').pop()?.toLowerCase()

  if (!mime || !extension) return null

  const command = new GetObjectCommand({
    Bucket: NEON_STORAGE_BUCKET,
    Key: key,
    ResponseContentType: mime,
    ResponseContentDisposition: `inline; filename="certificate.${extension}"`,
    ...(encoding === 'GZIP' ? { ResponseContentEncoding: 'gzip' } : {}),
  })

  return getSignedUrl(getClient(), command, { expiresIn: expiresInSeconds })
}

export async function headNeonObject(key: string): Promise<{
  size: number
  contentType: string
  contentEncoding: string | null
} | null> {
  try {
    const result = await getClient().send(
      new HeadObjectCommand({
        Bucket: NEON_STORAGE_BUCKET,
        Key: key,
      })
    )

    return {
      size: result.ContentLength ?? 0,
      contentType: result.ContentType ?? 'application/octet-stream',
      contentEncoding: result.ContentEncoding ?? null,
    }
  } catch (error) {
    if (isNotFoundError(error)) return null
    throw error
  }
}

export async function readNeonObjectPrefix(
  key: string,
  byteLength = 8
): Promise<Buffer> {
  const result = await getClient().send(
    new GetObjectCommand({
      Bucket: NEON_STORAGE_BUCKET,
      Key: key,
      Range: `bytes=0-${Math.max(0, byteLength - 1)}`,
    })
  )

  if (!result.Body) return Buffer.alloc(0)

  return Buffer.from(await result.Body.transformToByteArray())
}

export async function readNeonObject(key: string): Promise<Buffer> {
  const result = await getClient().send(
    new GetObjectCommand({
      Bucket: NEON_STORAGE_BUCKET,
      Key: key,
    })
  )

  if (!result.Body) return Buffer.alloc(0)

  return Buffer.from(await result.Body.transformToByteArray())
}

export async function putNeonObject(
  key: string,
  body: Buffer,
  contentType: string,
  contentEncoding?: 'gzip'
): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: NEON_STORAGE_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      ...(contentEncoding ? { ContentEncoding: contentEncoding } : {}),
    })
  )
}

export async function deleteNeonObject(key: string): Promise<void> {
  if (!isNeonStorageConfigured()) return

  try {
    await getClient().send(
      new DeleteObjectCommand({
        Bucket: NEON_STORAGE_BUCKET,
        Key: key,
      })
    )
  } catch {
    // Deleting orphaned objects is best effort.
  }
}
