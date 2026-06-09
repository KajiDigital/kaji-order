import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'
import type { OrderStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

const ACTIVE_STATUSES: OrderStatus[] = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY']
const REFUNDED_STATUSES: OrderStatus[] = ['REFUNDED', 'CANCELLED']

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const view = searchParams.get('view') ?? 'active'

  const orders = await prisma.onlineOrder.findMany({
    where:
      view === 'refunded'
        ? {
            restaurant_id: session.restaurantId,
            status: { in: REFUNDED_STATUSES },
          }
        : view === 'all'
          ? { restaurant_id: session.restaurantId }
          : {
              restaurant_id: session.restaurantId,
              status: { in: ACTIVE_STATUSES },
            },
    include: { items: true },
    orderBy: { created_at: 'desc' },
  })

  return NextResponse.json({ orders })
}
