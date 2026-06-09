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
      await prisma.onlineOrder.update({
        where: { id: order.id },
        data: { stripe_payment_status: 'captured' },
      })

      const emailData = buildOrderEmailFromDb(
        order,
        `${getAppUrl()}/dashboard/orders`
      )

      await sendOrderConfirmation(order.customer_email, emailData)

      if (order.restaurant.email && order.restaurant.email_notifications) {
        await sendRestaurantNewOrder(order.restaurant.email, emailData)
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
