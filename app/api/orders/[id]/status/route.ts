import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { formatOrderNumber, formatReadyAtTime } from '@/app/lib/utils'
import { cancelExpiredOrder } from '@/app/lib/order-expiry'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params

  const order = await prisma.onlineOrder.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      order_number: true,
      total_pence: true,
      customer_name: true,
      ready_at: true,
      estimated_ready_at: true,
      estimated_time: true,
      prep_time_mins: true,
      accept_by: true,
      items: {
        select: { name: true, quantity: true, price_pence: true },
      },
      restaurant: {
        select: { slug: true, order_mode: true, name: true, logo_url: true },
      },
    },
  })

  if (!order) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (
    order.status === 'PENDING' &&
    order.accept_by &&
    order.accept_by < new Date()
  ) {
    await cancelExpiredOrder(order.id)
    const refreshed = await prisma.onlineOrder.findUnique({
      where: { id },
      select: { status: true },
    })
    if (refreshed) order.status = refreshed.status
  }

  const readyAt = order.ready_at ?? order.estimated_ready_at

  return NextResponse.json({
    status: order.status,
    order_number: formatOrderNumber(order.order_number),
    ready_at: readyAt ? formatReadyAtTime(readyAt) : null,
    estimated_time: order.estimated_time,
    prep_time_mins: order.prep_time_mins,
    accept_by: order.accept_by?.toISOString() ?? null,
    slug: order.restaurant.slug,
    order_mode: order.restaurant.order_mode,
    total_pence: order.total_pence,
    customer_name: order.customer_name,
    items: order.items,
    restaurant: {
      name: order.restaurant.name,
      logo_url: order.restaurant.logo_url,
    },
  })
}
