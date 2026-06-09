import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { getNextOrderNumber } from '@/app/lib/orders'
import { getStripe, stripeConfigured } from '@/app/lib/stripe'
import { getServiceFeePence } from '@/app/lib/platform'
import { calculateOrderTotals } from '@/app/lib/service-fee'

export const dynamic = 'force-dynamic'

type CheckoutItem = {
  menuItemId: string
  name: string
  pricePence: number
  quantity: number
  modifiers?: { name: string; priceDeltaPence: number }[]
  notes?: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      slug,
      items,
      customer_name,
      customer_email,
      customer_phone,
      notes,
      order_type = 'COLLECTION',
    } = body as {
      slug: string
      items: CheckoutItem[]
      customer_name: string
      customer_email: string
      customer_phone?: string
      notes?: string
      order_type?: 'COLLECTION' | 'DELIVERY'
    }

    if (!slug || !items?.length || !customer_name || !customer_email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const restaurant = await prisma.restaurant.findFirst({
      where: { slug, deleted_at: null },
    })
    if (!restaurant || restaurant.status !== 'active') {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    const subtotal = items.reduce((sum, item) => {
      const modTotal = (item.modifiers ?? []).reduce((s, m) => s + m.priceDeltaPence, 0)
      return sum + (item.pricePence + modTotal) * item.quantity
    }, 0)

    if (subtotal < restaurant.min_order_pence) {
      return NextResponse.json(
        { error: `Minimum order is £${(restaurant.min_order_pence / 100).toFixed(2)}` },
        { status: 400 }
      )
    }

    const serviceFeePence = await getServiceFeePence()
    const deliveryFee = 0
    const totals = calculateOrderTotals(
      subtotal,
      restaurant.commission_pct,
      serviceFeePence,
      deliveryFee
    )
    const orderNumber = await getNextOrderNumber(restaurant.id)
    const periodMonth = new Date().toISOString().slice(0, 7)

    let clientSecret: string | null = null
    let paymentIntentId: string | null = null

    const stripe = getStripe()
    if (stripe && stripeConfigured()) {
      const intentParams: Parameters<typeof stripe.paymentIntents.create>[0] = {
        amount: totals.total,
        currency: 'gbp',
        metadata: {
          restaurant_id: restaurant.id,
          restaurant_slug: slug,
          order_number: String(orderNumber),
        },
        receipt_email: customer_email,
      }

      if (restaurant.stripe_account_id && totals.platformFeePence > 0) {
        intentParams.application_fee_amount = totals.platformFeePence
        intentParams.transfer_data = { destination: restaurant.stripe_account_id }
      }

      const intent = await stripe.paymentIntents.create(intentParams)
      clientSecret = intent.client_secret
      paymentIntentId = intent.id
    }

    const order = await prisma.onlineOrder.create({
      data: {
        restaurant_id: restaurant.id,
        order_number: orderNumber,
        status: 'PENDING',
        order_type,
        customer_name,
        customer_email,
        customer_phone: customer_phone ?? null,
        notes: notes ?? null,
        subtotal_pence: totals.subtotal,
        service_fee_pence: totals.serviceFee,
        delivery_fee_pence: totals.deliveryFee,
        total_pence: totals.total,
        commission_pct: restaurant.commission_pct,
        commission_pence: totals.commissionPence,
        stripe_payment_intent_id: paymentIntentId,
        stripe_payment_status: stripe ? 'authorised' : 'captured',
        items: {
          create: items.map((item) => ({
            menu_item_id: item.menuItemId,
            name: item.name,
            price_pence: item.pricePence,
            quantity: item.quantity,
            modifiers_json: item.modifiers ?? [],
            notes: item.notes ?? null,
          })),
        },
        commission_records: {
          create: {
            restaurant_id: restaurant.id,
            period_month: periodMonth,
            total_orders: 1,
            total_revenue_pence: totals.subtotal,
            food_commission_pence: totals.commissionPence,
            service_fee_pence: totals.serviceFee,
            total_platform_pence: totals.platformFeePence,
            commission_pence: totals.platformFeePence,
            status: 'PENDING',
          },
        },
      },
      include: { items: true },
    })

    if (!stripe) {
      return NextResponse.json({
        clientSecret: null,
        orderId: order.id,
        devMode: true,
      })
    }

    return NextResponse.json({
      clientSecret,
      orderId: order.id,
    })
  } catch (error) {
    console.error('create-intent error:', error)
    return NextResponse.json({ error: 'Payment setup failed' }, { status: 500 })
  }
}
