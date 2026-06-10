import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { getNextOrderNumber } from '@/app/lib/orders'
import { getStripe, stripeConfigured } from '@/app/lib/stripe'
import { getServiceFeePence } from '@/app/lib/platform'
import { calculateOrderTotals } from '@/app/lib/service-fee'
import { getOpenStatus } from '@/app/lib/opening-hours'
import { formatModifiersText, getReportingFields } from '@/app/lib/utils'
import { buildPrepFields } from '@/app/lib/order-expiry'
import {
  sendOrderConfirmation,
  sendRestaurantNewOrder,
  buildOrderEmailFromDb,
} from '@/app/lib/email'
import { getAppUrl } from '@/app/lib/utils'
import { incrementPromotionUsage, validatePromotion } from '@/app/lib/promotions'

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
      discount_pence: discountFromClient = 0,
      coupon_code,
      promotion_id,
      discount_description,
      discount_type,
    } = body as {
      slug: string
      items: CheckoutItem[]
      customer_name: string
      customer_email: string
      customer_phone?: string
      notes?: string
      order_type?: 'COLLECTION' | 'DELIVERY'
      discount_pence?: number
      coupon_code?: string
      promotion_id?: string
      discount_description?: string
      discount_type?: string
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

    const openStatus = getOpenStatus(
      restaurant.opening_hours,
      restaurant.holiday_mode,
      restaurant.accept_preorders,
      restaurant.show_menu_when_closed,
      restaurant.collection_enabled,
      restaurant.preorder_days_ahead,
      restaurant.holiday_message
    )

    if (!openStatus.canOrder) {
      return NextResponse.json(
        { error: openStatus.statusMessage || 'Restaurant is not accepting orders right now' },
        { status: 400 }
      )
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

    const menuItemIds = items.map((i) => i.menuItemId)
    const dbItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, restaurant_id: restaurant.id },
      select: { id: true, category_id: true },
    })
    const categoryByItem = new Map(dbItems.map((i) => [i.id, i.category_id]))

    const promoItems = items.map((item) => {
      const modTotal = (item.modifiers ?? []).reduce((s, m) => s + m.priceDeltaPence, 0)
      return {
        menuItemId: item.menuItemId,
        categoryId: categoryByItem.get(item.menuItemId) ?? '',
        quantity: item.quantity,
        lineTotalPence: (item.pricePence + modTotal) * item.quantity,
      }
    })

    let discountPence = 0
    let appliedPromotionId: string | null = null
    let appliedCoupon: string | null = null
    let appliedDescription = ''
    let appliedDiscountType = ''

    if (discountFromClient > 0 && (promotion_id || coupon_code)) {
      const validation = await validatePromotion({
        restaurantId: restaurant.id,
        subtotalPence: subtotal,
        items: promoItems,
        code: coupon_code,
        promotionId: promotion_id,
      })

      if (!validation.valid) {
        return NextResponse.json({ error: validation.error ?? 'Invalid discount' }, { status: 400 })
      }

      discountPence = validation.discount_pence
      appliedPromotionId = validation.promotion_id ?? null
      appliedCoupon = validation.coupon_code ?? null
      appliedDescription = validation.description
      appliedDiscountType = validation.discount_type ?? ''
    }

    const serviceFeePence = await getServiceFeePence()
    const deliveryFee = 0
    const totals = calculateOrderTotals(
      subtotal,
      restaurant.commission_pct,
      serviceFeePence,
      deliveryFee,
      discountPence
    )
    const orderNumber = await getNextOrderNumber(restaurant.id)
    const periodMonth = new Date().toISOString().slice(0, 7)
    const reporting = getReportingFields()
    const isInstant = restaurant.order_mode !== 'manual'

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
        status: isInstant && !stripe ? 'ACCEPTED' : 'PENDING',
        order_type,
        customer_name,
        customer_email,
        customer_phone: customer_phone ?? null,
        notes: notes ?? null,
        subtotal_pence: totals.subtotal,
        discount_total: discountPence,
        coupon_code: appliedCoupon,
        service_fee_pence: totals.serviceFee,
        delivery_fee_pence: totals.deliveryFee,
        total_pence: totals.total,
        commission_pct: restaurant.commission_pct,
        commission_pence: totals.commissionPence,
        stripe_payment_intent_id: paymentIntentId,
        stripe_payment_status: stripe ? 'authorised' : 'captured',
        payment_method: 'CARD',
        source: 'online',
        ...reporting,
        ...(isInstant && !stripe
          ? buildPrepFields(restaurant.avg_prep_minutes ?? 30)
          : {}),
        is_preorder: openStatus.isPreorderMode,
        preorder_for: openStatus.isPreorderMode ? openStatus.nextOpenAt : null,
        items: {
          create: items.map((item) => ({
            menu_item_id: item.menuItemId,
            pos_item_id: item.menuItemId,
            name: item.name,
            price_pence: item.pricePence,
            quantity: item.quantity,
            modifiers_json: item.modifiers ?? [],
            modifiers_text: formatModifiersText(item.modifiers),
            notes: item.notes ?? null,
          })),
        },
        discounts:
          discountPence > 0
            ? {
                create: {
                  promotion_id: appliedPromotionId,
                  coupon_code: appliedCoupon,
                  discount_type: appliedDiscountType || 'PROMOTION',
                  discount_pence: discountPence,
                  description: appliedDescription || discount_description || 'Discount',
                },
              }
            : undefined,
        commission_records: {
          create: {
            restaurant_id: restaurant.id,
            period_month: periodMonth,
            total_orders: 1,
            total_revenue_pence: Math.max(0, totals.subtotal - discountPence),
            food_commission_pence: totals.commissionPence,
            service_fee_pence: totals.serviceFee,
            total_platform_pence: totals.platformFeePence,
            commission_pence: totals.platformFeePence,
            status: 'PENDING',
          },
        },
      },
      include: { items: true, restaurant: true },
    })

    if (discountPence > 0 && appliedPromotionId) {
      await incrementPromotionUsage(appliedPromotionId, appliedCoupon)
    }

    if (!stripe) {
      if (isInstant) {
        const emailData = buildOrderEmailFromDb(
          order,
          `${getAppUrl()}/dashboard/orders`
        )
        emailData.estimatedMinutes = restaurant.avg_prep_minutes
        emailData.readyAt = order.ready_at?.toISOString()
        await sendOrderConfirmation(order.customer_email, emailData)
      }
      if (restaurant.email && restaurant.email_notifications) {
        await sendRestaurantNewOrder(
          restaurant.email,
          buildOrderEmailFromDb(order, `${getAppUrl()}/dashboard/orders`)
        )
      }
      return NextResponse.json({
        clientSecret: null,
        orderId: order.id,
        orderMode: restaurant.order_mode,
        devMode: true,
      })
    }

    return NextResponse.json({
      clientSecret,
      orderId: order.id,
      orderMode: restaurant.order_mode,
    })
  } catch (error) {
    console.error('create-intent error:', error)
    return NextResponse.json({ error: 'Payment setup failed' }, { status: 500 })
  }
}
