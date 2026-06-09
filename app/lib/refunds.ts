import type { StripePaymentStatus } from '@prisma/client'

export const REFUND_REASONS = [
  'Order taking too long',
  'Item unavailable',
  'Quality issue',
  'Customer changed mind',
  'Other',
] as const

export type RefundReason = (typeof REFUND_REASONS)[number]

export type PaymentPhase = 'authorised' | 'captured' | 'cancelled' | 'refunded' | 'other'

export function getPaymentPhase(status: StripePaymentStatus): PaymentPhase {
  if (status === 'pending' || status === 'authorised') return 'authorised'
  if (status === 'paid' || status === 'captured') return 'captured'
  if (status === 'cancelled') return 'cancelled'
  if (status === 'refunded') return 'refunded'
  return 'other'
}

export function canRefundOrder(
  status: string,
  paymentStatus: StripePaymentStatus
): boolean {
  if (status === 'REFUNDED' || status === 'CANCELLED') return false
  const phase = getPaymentPhase(paymentStatus)
  return phase === 'authorised' || phase === 'captured'
}
