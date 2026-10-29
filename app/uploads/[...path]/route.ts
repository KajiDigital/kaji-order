import { readFile } from 'fs/promises'
import { NextResponse } from 'next/server'
import { contentTypeFor, resolveUploadFile } from '@/app/lib/uploads'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Params = { params: Promise<{ path: string[] }> }

export async function GET(_request: Request, { params }: Params) {
  const { path: parts } = await params
  if (!parts?.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let dest: string
  try {
    dest = resolveUploadFile(parts.join('/'))
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const type = contentTypeFor(dest)
  if (!type) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const body = await readFile(dest)
    return new NextResponse(new Uint8Array(body), {
      headers: {
        'Content-Type': type,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
