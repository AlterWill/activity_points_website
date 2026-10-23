import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { certificateKeyFor, readCertificate } from '@/lib/certificates'
import { prisma } from '@/lib/prisma'
import { createNeonDownloadUrl } from '@/lib/neon-storage'
import { isUuid } from '@/lib/validation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ studentId: string; fileName: string }> }
) {
  const { studentId, fileName } = await params

  if (!isUuid(studentId)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const user = await getCurrentUser()
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  if (user.role !== 'ADMIN' && user.id !== studentId) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const certificateUrl = `/api/certificates/${studentId}/${fileName}`

  try {
    const submission = await prisma.submission.findFirst({
      where: {
        studentId,
        certificateUrl,
      },
      select: {
        id: true,
        certificateStorage: true,
        certificateEncoding: true,
      },
    })

    if (!submission) {
      return new NextResponse('Not found', { status: 404 })
    }

    if (submission.certificateStorage === 'NEON') {
      const downloadUrl = await createNeonDownloadUrl(
        certificateKeyFor(studentId, fileName),
        fileName,
        submission.certificateEncoding
      )

      if (!downloadUrl) {
        return new NextResponse('Not found', { status: 404 })
      }

      return NextResponse.redirect(downloadUrl, {
        headers: { 'Cache-Control': 'private, no-store, max-age=0' },
      })
    }

    const certificate = await readCertificate(
      studentId,
      fileName,
      submission.certificateStorage
    )
    if (!certificate) {
      return new NextResponse('Not found', { status: 404 })
    }

    const extension = fileName.split('.').pop()?.toLowerCase() || 'pdf'

    return new NextResponse(new Uint8Array(certificate.buffer), {
      status: 200,
      headers: {
        'Content-Type': certificate.mime,
        'Content-Length': String(certificate.buffer.length),
        'Content-Disposition': `inline; filename="certificate.${extension}"`,
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Certificate download failed:', error)
    return new NextResponse('Unable to load certificate', { status: 500 })
  }
}
