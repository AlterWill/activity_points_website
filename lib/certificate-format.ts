export type CertificateExtension = 'pdf' | 'png' | 'jpg'

export const CERTIFICATE_MIME_BY_EXTENSION: Record<CertificateExtension, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
}

export function certificateExtensionForFileName(fileName: string): CertificateExtension | null {
  const extension = fileName.split('.').pop()?.toLowerCase()

  if (extension === 'jpeg') return 'jpg'
  if (extension === 'pdf' || extension === 'png' || extension === 'jpg') return extension

  return null
}

export function certificateMimeForFileName(fileName: string): string | null {
  const extension = certificateExtensionForFileName(fileName)
  return extension ? CERTIFICATE_MIME_BY_EXTENSION[extension] : null
}
