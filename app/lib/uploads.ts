import { randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

export const UPLOAD_KINDS = ['menu', 'logo', 'banner'] as const
export type UploadKind = (typeof UPLOAD_KINDS)[number]

const MAX_BYTES = 2 * 1024 * 1024

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
}

export function getUploadRoot() {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
}

export function resolveUploadFile(relative: string) {
  const root = path.resolve(getUploadRoot())
  const dest = path.resolve(root, relative)
  if (dest !== root && !dest.startsWith(root + path.sep)) {
    throw new Error('Invalid path')
  }
  return dest
}

export function contentTypeFor(filename: string) {
  const ext = path.extname(filename).slice(1).toLowerCase()
  return CONTENT_TYPES[ext] ?? null
}

function sniffExtension(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpg'
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'png'
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'webp'
  }
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return 'gif'
  }
  return null
}

export async function saveRestaurantUpload(
  restaurantId: string,
  kind: string,
  file: File
): Promise<{ url: string }> {
  if (!UPLOAD_KINDS.includes(kind as UploadKind)) {
    throw new Error('Invalid upload kind')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Image is too large (max 2MB)')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = sniffExtension(buffer)
  if (!ext) {
    throw new Error('Please upload a JPG, PNG, WebP, or GIF')
  }

  const relative = path.posix.join(restaurantId, kind, `${randomUUID()}.${ext}`)
  const dest = path.join(getUploadRoot(), relative)
  await mkdir(path.dirname(dest), { recursive: true })
  await writeFile(dest, buffer)

  return { url: `/uploads/${relative}` }
}
