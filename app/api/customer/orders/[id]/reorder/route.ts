import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { getCustomerSession } from '@/app/lib/customer-auth'
import { buildReorder } from '@/app/lib/reorder'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCustomerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const order = await prisma.onlineOrder.findFirst({
    where: {
      id,
      restaurant_id: session.restaurantId,
      customer_id: session.customerId,
    },
    select: { id: true, order_type: true },
  })
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const result = await buildReorder(session.restaurantId, order.id)
  if (!result) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  return NextResponse.json({
    ...result,
    order_type: order.order_type === 'DELIVERY' ? 'delivery' : 'collection',
  })
}
