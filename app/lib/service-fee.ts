export const DEFAULT_SERVICE_FEE_PENCE = 49

export type OrderTotals = {
  subtotal: number
  serviceFee: number
  deliveryFee: number
  total: number
  commissionPence: number
  platformFeePence: number
}

export function calculateOrderTotals(
  subtotal: number,
  commissionPct: number,
  serviceFeePence: number,
  deliveryFee = 0
): OrderTotals {
  const serviceFee = serviceFeePence
  const total = subtotal + serviceFee + deliveryFee
  const commissionPence = Math.round((subtotal * commissionPct) / 100)
  const platformFeePence = commissionPence + serviceFee

  return {
    subtotal,
    serviceFee,
    deliveryFee,
    total,
    commissionPence,
    platformFeePence,
  }
}
