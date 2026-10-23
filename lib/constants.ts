export const MAX_PDF_CERTIFICATE_MB = 5
export const MAX_IMAGE_CERTIFICATE_MB = 2

export const MAX_SOURCE_IMAGE_MB = 15
export const MAX_SOURCE_IMAGE_BYTES = MAX_SOURCE_IMAGE_MB * 1024 * 1024

export const CERTIFICATE_ACCEPT =
  '.pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg'

export const CERTIFICATE_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
] as const

export const MAX_PENDING_SUBMISSIONS = 25
