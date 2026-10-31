import { NextResponse } from 'next/server'
import { getAdminSession } from '@/app/lib/admin-auth'
import { approveRestaurant } from '@/app/lib/admin-restaurant-status'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Params = { params: Promise<{ id: string }> }

export async function POST(_request: Request, { params }: Params) {
  const admin = await getAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const result = await approveRestaurant(id, admin.email)
  if (!result.ok) {
    const status = result.error === 'Not found' ? 404 : result.error.includes('already exists') ? 409 : 400
    return NextResponse.json({ error: result.error }, { status })
  }
  return NextResponse.json({ success: true })
}
