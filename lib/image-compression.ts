const MAX_IMAGE_DIMENSION = 2400
const IMAGE_QUALITY = 0.85
const SMALL_IMAGE_BYTES = 1.5 * 1024 * 1024

export async function compressCertificateImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.size <= SMALL_IMAGE_BYTES) {
    return file
  }

  if (typeof createImageBitmap !== 'function') {
    return file
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }

  try {
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) return file

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
    context.drawImage(bitmap, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', IMAGE_QUALITY)
    })

    if (!blob || blob.size >= file.size) {
      return file
    }

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'certificate'
    return new File([blob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: file.lastModified,
    })
  } finally {
    bitmap.close()
  }
}
