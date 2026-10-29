import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import { saveRestaurantUpload } from '@/app/lib/uploads'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await request.formData().catch(() => null)
  if (!form) {
    return NextResponse.json({ error: 'Invalid upload' }, { status: 400 })
  }

  const file = form.get('file')
  const kind = String(form.get('kind') ?? 'menu')
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'Choose a photo' }, { status: 400 })
  }

  try {
    const saved = await saveRestaurantUpload(session.restaurantId, kind, file)
    return NextResponse.json(saved)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not save photo'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
