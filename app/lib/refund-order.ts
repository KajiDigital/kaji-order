import prisma from './prisma'
import { getStripe } from './stripe'
import { sendRefundConfirmation } from './email'
import { getPaymentPhase } from './refunds'

export type RefundResult =
  | { success: true; refund_type: 'cancel' | 'refund'; amount_pence: number }
  | { success: false; error: string; status: number }

type RefundOptions = {
  orderId: string
  reason: string
  amountPence?: number
  restaurantId?: string
  allowPartial?: boolean
}

export async function processOrderRefund(options: RefundOptions): Promise<RefundResult> {
  const { orderId, reason, amountPence, restaurantId, allowPartial = false } = options

  if (!reason?.trim()) {
    return { success: false, error: 'Reason is required', status: 400 }
  }

  const order = await prisma.onlineOrder.findFirst({
    where: {
      id: orderId,
      ...(restaurantId ? { restaurant_id: restaurantId } : {}),
    },
    include: { restaurant: true },
  })

  if (!order) {
    return { success: false, error: 'Forbidden', status: 403 }
  }

  if (order.status === 'REFUNDED') {
    return { success: false, error: 'Order already refunded', status: 400 }
  }

  const phase = getPaymentPhase(order.stripe_payment_status)
  if (phase === 'cancelled' || phase === 'refunded') {
    return { success: false, error: 'Payment already cancelled or refunded', status: 400 }
  }

  if (phase !== 'authorised' && phase !== 'captured') {
    return { success: false, error: 'Order cannot be refunded', status: 400 }
  }

  const stripe = getStripe()
  let refundType: 'cancel' | 'refund'
  let refundAmount = order.total_pence

  if (phase === 'authorised') {
    if (amountPence !== undefined && amountPence !== order.total_pence) {
      return { success: false, error: 'Partial cancellation is not supported', status: 400 }
    }

    if (stripe && order.stripe_payment_intent_id) {
      await stripe.paymentIntents.cancel(order.stripe_payment_intent_id)
    }

    await prisma.onlineOrder.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        stripe_payment_status: 'cancelled',
        refund_reason: reason.trim(),
        refund_amount_pence: order.total_pence,
      },
    })

    refundType = 'cancel'
    refundAmount = order.total_pence
  } else {
    refundAmount = amountPence ?? order.total_pence

    if (refundAmount <= 0 || refundAmount > order.total_pence) {
      return { success: false, error: 'Invalid refund amount', status: 400 }
    }

    if (!allowPartial && refundAmount !== order.total_pence) {
      return { success: false, error: 'Only full refunds are allowed', status: 400 }
    }

    if (stripe && order.stripe_payment_intent_id) {
      await stripe.refunds.create({
        payment_intent: order.stripe_payment_intent_id,
        amount: refundAmount,
        reason: 'requested_by_customer',
        metadata: {
          order_id: order.id,
          restaurant_id: order.restaurant_id,
          refund_reason: reason.trim(),
        },
      })
    }

    await prisma.onlineOrder.update({
      where: { id: order.id },
      data: {
        status: 'REFUNDED',
        stripe_payment_status: 'refunded',
        refund_reason: reason.trim(),
        refund_amount_pence: refundAmount,
      },
    })

    refundType = 'refund'
  }

  await prisma.commissionRecord.updateMany({
    where: { order_id: order.id },
    data: { status: 'REFUNDED' },
  })

  await sendRefundConfirmation(order.customer_email, {
    customerName: order.customer_name,
    restaurantName: order.restaurant.name,
    orderNumber: order.order_number,
    amountPence: refundAmount,
  })

  return { success: true, refund_type: refundType, amount_pence: refundAmount }
}

export async function markOrderRefundedFromStripe(paymentIntentId: string) {
  const order = await prisma.onlineOrder.findFirst({
    where: { stripe_payment_intent_id: paymentIntentId },
  })

  if (!order) return null

  const phase = getPaymentPhase(order.stripe_payment_status)
  if (phase === 'refunded') return order

  await prisma.onlineOrder.update({
    where: { id: order.id },
    data: {
      status: 'REFUNDED',
      stripe_payment_status: 'refunded',
      refund_amount_pence: order.refund_amount_pence ?? order.total_pence,
    },
  })

  await prisma.commissionRecord.updateMany({
    where: { order_id: order.id },
    data: { status: 'REFUNDED' },
  })

  console.log('[stripe] refund confirmed by Stripe for order', order.id)
  return order
}
