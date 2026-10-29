import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import { verifyOrderOwnership } from '@/app/lib/orders'
import prisma from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const BOARD_STATUSES = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COLLECTED'] as const

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { status?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const status = typeof body.status === 'string' ? body.status : ''
  if (!BOARD_STATUSES.includes(status as (typeof BOARD_STATUSES)[number])) {
    return NextResponse.json({ error: 'Choose a kitchen status' }, { status: 400 })
  }

  const { id } = await params
  const order = await verifyOrderOwnership(id, session.restaurantId)
  if (!order) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (!BOARD_STATUSES.includes(order.status as (typeof BOARD_STATUSES)[number])) {
    return NextResponse.json({ error: 'This order can no longer be moved' }, { status: 409 })
  }

  if (order.status === 'PENDING' && status === 'ACCEPTED') {
    return NextResponse.json(
      { error: 'Accept the order and choose a ready time first' },
      { status: 409 }
    )
  }

  const updated = await prisma.onlineOrder.update({
    where: { id },
    data: { status: status as (typeof BOARD_STATUSES)[number] },
    include: { items: true },
  })

  return NextResponse.json({ order: updated })
}
