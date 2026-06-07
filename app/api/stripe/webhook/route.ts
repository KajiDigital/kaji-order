import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import prisma from '@/app/lib/prisma'
import { getStripe } from '@/app/lib/stripe'
import {
  sendOrderConfirmation,
  sendRestaurantNewOrder,
} from '@/app/lib/email'
import { getAppUrl } from '@/app/lib/utils'

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
        data: { stripe_payment_status: 'paid' },
      })

      const emailData = {
        orderNumber: order.order_number,
        restaurantName: order.restaurant.name,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        items: order.items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          pricePence: i.price_pence,
        })),
        totalPence: order.total_pence,
        estimatedMinutes: order.restaurant.avg_prep_minutes,
        notes: order.notes,
      }

      await sendOrderConfirmation(order.customer_email, emailData)

      if (order.restaurant.email && order.restaurant.email_notifications) {
        await sendRestaurantNewOrder(order.restaurant.email, {
          ...emailData,
          dashboardUrl: `${getAppUrl()}/dashboard/orders`,
        })
      }
    }
  }

  return NextResponse.json({ received: true })
}
