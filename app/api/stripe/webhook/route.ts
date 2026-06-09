import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import prisma from '@/app/lib/prisma'
import { getStripe } from '@/app/lib/stripe'
import {
  sendOrderConfirmation,
  sendRestaurantNewOrder,
  buildOrderEmailFromDb,
} from '@/app/lib/email'
import { getAppUrl } from '@/app/lib/utils'
import { markOrderRefundedFromStripe } from '@/app/lib/refund-order'
import { buildPrepFields } from '@/app/lib/order-expiry'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const body = await request.text()
  const headerStore = await headers()
  const sig = headerStore.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object
    const order = await prisma.onlineOrder.findFirst({
      where: { stripe_payment_intent_id: intent.id },
      include: { items: true, restaurant: true },
    })

    if (order) {
      const restaurant = order.restaurant
      const isInstant = restaurant.order_mode !== 'manual'
      const prepMins = restaurant.avg_prep_minutes ?? 30
      const dashboardUrl = `${getAppUrl()}/dashboard/orders`

      if (isInstant) {
        const prepFields = buildPrepFields(prepMins)
        await prisma.onlineOrder.update({
          where: { id: order.id },
          data: {
            stripe_payment_status: 'captured',
            status: 'ACCEPTED',
            ...prepFields,
          },
        })

        const emailData = buildOrderEmailFromDb(order, dashboardUrl)
        emailData.estimatedMinutes = prepMins
        emailData.readyAt = prepFields.ready_at.toISOString()
        emailData.prepTimeFormatted = prepFields.estimated_time

        await sendOrderConfirmation(order.customer_email, emailData)
      } else {
        const acceptBy = new Date(
          Date.now() + (restaurant.acceptance_timer_mins ?? 3) * 60_000
        )
        await prisma.onlineOrder.update({
          where: { id: order.id },
          data: {
            stripe_payment_status: 'captured',
            accept_by: acceptBy,
          },
        })
      }

      if (restaurant.email && restaurant.email_notifications) {
        await sendRestaurantNewOrder(
          restaurant.email,
          buildOrderEmailFromDb(order, dashboardUrl)
        )
      }
    }
  }

  if (event.type === 'charge.refunded') {
    const charge = event.data.object
    const paymentIntentId =
      typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : charge.payment_intent?.id

    if (paymentIntentId) {
      await markOrderRefundedFromStripe(paymentIntentId)
    }
  }

  return NextResponse.json({ received: true })
}
