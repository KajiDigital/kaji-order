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
import { captureOrderPayment } from '@/app/lib/payment-capture'

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

  const body = await request.json().catch(() => ({})) as {
    prep_time_mins?: unknown
    ready_at?: unknown
  }

  let readyAt: Date | undefined
  let prepTimeMins: number

  if (typeof body.ready_at === 'string' && body.ready_at.trim()) {
    readyAt = new Date(body.ready_at)
    if (Number.isNaN(readyAt.getTime())) {
      return NextResponse.json({ error: 'Choose a valid ready time' }, { status: 400 })
    }
    if (readyAt.getTime() < Date.now() - 60_000) {
      return NextResponse.json({ error: 'Ready time is in the past' }, { status: 400 })
    }
    if (readyAt.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
      return NextResponse.json({ error: 'Ready time is too far ahead' }, { status: 400 })
    }
    prepTimeMins = Math.max(1, Math.round((readyAt.getTime() - Date.now()) / 60_000))
  } else {
    prepTimeMins = Math.min(
      120,
      Math.max(5, Number(body.prep_time_mins) || order.restaurant.avg_prep_minutes || 30)
    )
  }

  if (order.stripe_payment_intent_id) {
    const captured = await captureOrderPayment(order.stripe_payment_intent_id)
    if (!captured.ok) {
      return NextResponse.json({ error: captured.error }, { status: 409 })
    }
  }

  const prepFields = buildPrepFields(prepTimeMins, readyAt)

  const updated = await prisma.onlineOrder.update({
    where: { id },
    data: {
      status: 'ACCEPTED',
      stripe_payment_status: order.stripe_payment_intent_id
        ? 'captured'
        : order.stripe_payment_status,
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
