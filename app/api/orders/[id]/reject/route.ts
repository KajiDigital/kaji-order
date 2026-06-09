import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import { verifyOrderOwnership } from '@/app/lib/orders'
import prisma from '@/app/lib/prisma'
import { getStripe } from '@/app/lib/stripe'
import { sendOrderCancellation } from '@/app/lib/email'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

async function voidPayment(order: {
  stripe_payment_intent_id: string | null
  stripe_payment_status: string
}) {
  const stripe = getStripe()
  if (!stripe || !order.stripe_payment_intent_id) return 'cancelled' as const

  const phase = order.stripe_payment_status
  try {
    if (phase === 'authorised' || phase === 'pending') {
      await stripe.paymentIntents.cancel(order.stripe_payment_intent_id)
      return 'cancelled' as const
    }
    if (phase === 'captured' || phase === 'paid') {
      await stripe.refunds.create({
        payment_intent: order.stripe_payment_intent_id,
        reason: 'requested_by_customer',
      })
      return 'refunded' as const
    }
  } catch (err) {
    console.error('[reject] Stripe error:', err)
  }
  return phase
}

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
  const rejectReason = reason ?? 'Rejected by restaurant'

  const paymentStatus = await voidPayment(order)

  const updated = await prisma.onlineOrder.update({
    where: { id },
    data: {
      status: 'REJECTED',
      reject_reason: rejectReason,
      stripe_payment_status:
        paymentStatus === 'refunded'
          ? 'refunded'
          : paymentStatus === 'cancelled'
            ? 'cancelled'
            : order.stripe_payment_status,
    },
    include: { items: true },
  })

  await prisma.commissionRecord.updateMany({
    where: { order_id: id },
    data: { status: 'REFUNDED' },
  })

  await sendOrderCancellation(order.customer_email, {
    customerName: order.customer_name,
    restaurantName: order.restaurant.name,
    orderNumber: order.order_number,
    reason: rejectReason,
  })

  return NextResponse.json({ order: updated })
}
