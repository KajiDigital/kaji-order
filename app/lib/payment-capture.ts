import prisma from './prisma'
import { getStripe } from './stripe'
import { getAppUrl } from './utils'
import { sendRestaurantNewOrder, buildOrderEmailFromDb } from './email'

export async function captureOrderPayment(
  paymentIntentId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const stripe = getStripe()
  if (!stripe) return { ok: true }

  const intent = await stripe.paymentIntents.retrieve(paymentIntentId)

  if (intent.status === 'succeeded') return { ok: true }

  if (intent.status === 'requires_capture') {
    await stripe.paymentIntents.capture(paymentIntentId)
    return { ok: true }
  }

  if (intent.status === 'canceled') {
    return { ok: false, error: 'This card authorisation was cancelled' }
  }

  return { ok: false, error: 'The card has not been authorised yet' }
}

export async function markManualAuthorisation(paymentIntentId: string) {
  const order = await prisma.onlineOrder.findFirst({
    where: { stripe_payment_intent_id: paymentIntentId },
    include: { items: true, restaurant: true },
  })

  if (!order) return
  if (order.restaurant.order_mode !== 'manual') return
  if (order.status !== 'PENDING') return
  if (order.accept_by) return

  const restaurant = order.restaurant
  const acceptBy = new Date(
    Date.now() + (restaurant.acceptance_timer_mins ?? 3) * 60_000
  )

  await prisma.onlineOrder.update({
    where: { id: order.id },
    data: {
      stripe_payment_status: 'authorised',
      accept_by: acceptBy,
    },
  })

  if (restaurant.email && restaurant.email_notifications) {
    await sendRestaurantNewOrder(
      restaurant.email,
      buildOrderEmailFromDb(order, `${getAppUrl()}/dashboard/orders`)
    )
  }
}

export async function ensureManualAuthorisation(orderId: string) {
  const order = await prisma.onlineOrder.findUnique({
    where: { id: orderId },
    select: {
      status: true,
      accept_by: true,
      stripe_payment_intent_id: true,
      restaurant: { select: { order_mode: true } },
    },
  })

  if (!order?.stripe_payment_intent_id) return
  if (order.restaurant.order_mode !== 'manual') return
  if (order.status !== 'PENDING' || order.accept_by) return

  const stripe = getStripe()
  if (!stripe) return

  const intent = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id)
  if (intent.status === 'requires_capture') {
    await markManualAuthorisation(order.stripe_payment_intent_id)
  }
}
