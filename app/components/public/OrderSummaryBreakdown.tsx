'use client'

import { formatPence } from '@/app/lib/utils'

function ServiceFeeTooltip() {
  return (
    <span className="relative inline-flex group">
      <button
        type="button"
        aria-label="Service fee information"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold text-slate-500 hover:border-slate-400 hover:text-slate-700"
      >
        i
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-48 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-normal text-white shadow-lg group-hover:block group-focus-within:block"
      >
        Covers payment processing costs
      </span>
    </span>
  )
}

export function OrderSummaryBreakdown({
  subtotal,
  serviceFeePence,
  deliveryFeePence = 0,
  className = '',
}: {
  subtotal: number
  serviceFeePence: number
  deliveryFeePence?: number
  className?: string
}) {
  const total = subtotal + serviceFeePence + deliveryFeePence

  return (
    <div className={`space-y-2 text-sm ${className}`}>
      <div className="flex justify-between text-slate-600">
        <span>Subtotal</span>
        <span>{formatPence(subtotal)}</span>
      </div>
      <div className="flex justify-between text-slate-600">
        <span className="flex items-center gap-1.5">
          Service fee
          <ServiceFeeTooltip />
        </span>
        <span>{formatPence(serviceFeePence)}</span>
      </div>
      {deliveryFeePence > 0 && (
        <div className="flex justify-between text-slate-600">
          <span>Delivery</span>
          <span>{formatPence(deliveryFeePence)}</span>
        </div>
      )}
      <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
        <span>Total</span>
        <span>{formatPence(total)}</span>
      </div>
    </div>
  )
}
