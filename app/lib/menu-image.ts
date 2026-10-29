/** Max edge length for menu item photos (keeps pages fast). */
export const MENU_ITEM_IMAGE_MAX_PX = 800

/** JPEG/WebP quality after resize (0–1). */
export const MENU_ITEM_IMAGE_QUALITY = 0.82

export type ResizeMenuImageOptions = {
  maxSize?: number
  quality?: number
  mimeType?: 'image/webp' | 'image/jpeg'
}

export type ResizedMenuImage = {
  blob: Blob
  width: number
  height: number
  mimeType: string
  previewUrl: string
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read image'))
    }
    img.src = url
  })
}

function scaledDimensions(
  width: number,
  height: number,
  maxSize: number
): { width: number; height: number } {
  if (width <= maxSize && height <= maxSize) {
    return { width, height }
  }
  const scale = maxSize / Math.max(width, height)
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Could not compress image'))
      },
      mimeType,
      quality
    )
  })
}

/**
 * Resize any uploaded image to a web-friendly size before upload/storage.
 * Uses canvas in the browser — call before POST to media API.
 */
export async function resizeMenuImage(
  file: File,
  options: ResizeMenuImageOptions = {}
): Promise<ResizedMenuImage> {
  const maxSize = options.maxSize ?? MENU_ITEM_IMAGE_MAX_PX
  const quality = options.quality ?? MENU_ITEM_IMAGE_QUALITY
  let mimeType = options.mimeType ?? 'image/webp'

  const img = await loadImageFromFile(file)
  const { width, height } = scaledDimensions(img.naturalWidth, img.naturalHeight, maxSize)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  ctx.drawImage(img, 0, 0, width, height)

  let blob: Blob
  try {
    blob = await canvasToBlob(canvas, mimeType, quality)
  } catch {
    mimeType = 'image/jpeg'
    blob = await canvasToBlob(canvas, mimeType, quality)
  }

  return {
    blob,
    width,
    height,
    mimeType,
    previewUrl: URL.createObjectURL(blob),
  }
}

const KIND_MAX_PX = {
  menu: MENU_ITEM_IMAGE_MAX_PX,
  logo: 800,
  banner: 1600,
} as const

export type UploadKind = keyof typeof KIND_MAX_PX

/** Resize in the browser, then save the file on the server. Returns a public /uploads/... URL. */
export async function uploadResizedImage(file: File, kind: UploadKind): Promise<string> {
  const resized = await resizeMenuImage(file, { maxSize: KIND_MAX_PX[kind] })
  const ext = resized.mimeType === 'image/jpeg' ? 'jpg' : 'webp'
  const form = new FormData()
  form.append('file', resized.blob, `photo.${ext}`)
  form.append('kind', kind)

  try {
    const res = await fetch('/api/uploads', { method: 'POST', body: form })
    const data = (await res.json()) as { url?: string; error?: string }
    if (!res.ok || !data.url) {
      throw new Error(data.error || 'Could not save photo')
    }
    return data.url
  } finally {
    revokeMenuImagePreview(resized.previewUrl)
  }
}

export function revokeMenuImagePreview(url: string | null | undefined) {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}
