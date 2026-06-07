import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import { verifyOrderOwnership } from '@/app/lib/orders'
import prisma from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const order = await verifyOrderOwnership(id, session.restaurantId)
  if (!order) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { reason } = await request.json().catch(() => ({ reason: undefined }))

  const updated = await prisma.onlineOrder.update({
    where: { id },
    data: {
      status: 'REJECTED',
      reject_reason: reason ?? 'Rejected by restaurant',
    },
    include: { items: true },
  })

  return NextResponse.json({ order: updated })
}
