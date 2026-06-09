import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import { verifyOrderOwnership } from '@/app/lib/orders'
import prisma from '@/app/lib/prisma'
import { buildPrepFields } from '@/app/lib/order-expiry'
import {
  sendOrderConfirmation,
  buildOrderEmailFromDb,
} from '@/app/lib/email'
import { getAppUrl } from '@/app/lib/utils'

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

  const body = await request.json().catch(() => ({}))
  const prepTimeMins = Math.min(
    120,
    Math.max(5, Number(body.prep_time_mins) || order.restaurant.avg_prep_minutes || 30)
  )

  const prepFields = buildPrepFields(prepTimeMins)

  const updated = await prisma.onlineOrder.update({
    where: { id },
    data: {
      status: 'ACCEPTED',
      ...prepFields,
    },
    include: { items: true, restaurant: true },
  })

  const emailData = buildOrderEmailFromDb(
    updated,
    `${getAppUrl()}/dashboard/orders`
  )
  emailData.estimatedMinutes = prepTimeMins
  emailData.readyAt = prepFields.ready_at.toISOString()
  emailData.prepTimeFormatted = prepFields.estimated_time

  await sendOrderConfirmation(updated.customer_email, emailData)

  return NextResponse.json({ order: updated })
}
