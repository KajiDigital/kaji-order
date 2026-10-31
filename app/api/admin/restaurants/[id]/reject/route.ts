import { NextResponse } from 'next/server'
import { getAdminSession } from '@/app/lib/admin-auth'
import { rejectRestaurant } from '@/app/lib/admin-restaurant-status'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }

export async function POST(_request: Request, { params }: Params) {
  const admin = await getAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const result = await rejectRestaurant(id, admin.email)
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error === 'Not found' ? 404 : 400 }
    )
  }
  return NextResponse.json({ success: true })
}
