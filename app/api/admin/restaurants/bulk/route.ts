import { NextResponse } from 'next/server'
import { getAdminSession } from '@/app/lib/admin-auth'
import {
  activateRestaurant,
  approveRestaurant,
  deactivateRestaurant,
  rejectRestaurant,
} from '@/app/lib/admin-restaurant-status'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ACTIONS = {
  activate: activateRestaurant,
  deactivate: deactivateRestaurant,
  approve: approveRestaurant,
  reject: rejectRestaurant,
} as const

type BulkAction = keyof typeof ACTIONS

export async function POST(request: Request) {
  const admin = await getAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const action = body?.action as BulkAction | undefined
  const ids = Array.isArray(body?.ids)
    ? body.ids.filter((id: unknown) => typeof id === 'string' && id.trim())
    : []

  if (!action || !(action in ACTIONS)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
  if (ids.length === 0) {
    return NextResponse.json({ error: 'Select at least one restaurant' }, { status: 400 })
  }
  if (ids.length > 50) {
    return NextResponse.json({ error: 'Select up to 50 restaurants at a time' }, { status: 400 })
  }

  const updated: string[] = []
  const skipped: { id: string; name: string; error: string }[] = []

  for (const id of ids) {
    const result = await ACTIONS[action](id, admin.email)
    if (result.ok) updated.push(result.name)
    else skipped.push({ id: result.id, name: result.name, error: result.error })
  }

  return NextResponse.json({ updated: updated.length, skipped })
}
