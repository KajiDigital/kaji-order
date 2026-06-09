import prisma from './prisma'
import { getStripe } from './stripe'
import { sendOrderCancellation } from './email'

export async function cancelExpiredOrder(orderId: string): Promise<boolean> {
  const order = await prisma.onlineOrder.findUnique({
    where: { id: orderId },
    include: { restaurant: true },
  })

  if (!order) return false
  if (order.status !== 'PENDING') return false
  if (!order.accept_by || order.accept_by >= new Date()) return false

  await cancelPendingOrder(order.id, 'Order timed out — not accepted in time')
  return true
}

export async function cancelPendingOrder(
  orderId: string,
  reason: string
): Promise<void> {
  const order = await prisma.onlineOrder.findUnique({
    where: { id: orderId },
    include: { restaurant: true },
  })

  if (!order || order.status !== 'PENDING') {
    if (order?.status === 'CANCELLED' || order?.status === 'REJECTED') return
    return
  }

  const stripe = getStripe()
  const phase = order.stripe_payment_status

  if (stripe && order.stripe_payment_intent_id) {
    try {
      if (phase === 'authorised' || phase === 'pending') {
        await stripe.paymentIntents.cancel(order.stripe_payment_intent_id)
      } else if (phase === 'captured' || phase === 'paid') {
        await stripe.refunds.create({
          payment_intent: order.stripe_payment_intent_id,
          reason: 'requested_by_customer',
        })
      }
    } catch (err) {
      console.error('[cancelPendingOrder] Stripe error:', err)
    }
  }

  await prisma.onlineOrder.update({
    where: { id: orderId },
    data: {
      status: 'CANCELLED',
      stripe_payment_status:
        phase === 'captured' || phase === 'paid' ? 'refunded' : 'cancelled',
      reject_reason: reason,
    },
  })

  await prisma.commissionRecord.updateMany({
    where: { order_id: orderId },
    data: { status: 'REFUNDED' },
  })

  await sendOrderCancellation(order.customer_email, {
    customerName: order.customer_name,
    restaurantName: order.restaurant.name,
    orderNumber: order.order_number,
    reason,
  })
}

export async function processExpiredOrders(): Promise<number> {
  const expired = await prisma.onlineOrder.findMany({
    where: {
      status: 'PENDING',
      accept_by: { lt: new Date() },
    },
    select: { id: true },
  })

  for (const order of expired) {
    await cancelExpiredOrder(order.id)
  }

  return expired.length
}

export function buildPrepFields(prepTimeMins: number) {
  const readyAt = new Date(Date.now() + prepTimeMins * 60_000)
  return {
    prep_time_mins: prepTimeMins,
    ready_at: readyAt,
    estimated_ready_at: readyAt,
    estimated_time: `${prepTimeMins} minutes`,
  }
}
