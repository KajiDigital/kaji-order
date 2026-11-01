'use client'

import type { AppliedDiscount } from '@/app/lib/basket'
import { formatPence } from '@/app/lib/utils'

export function CartCouponField({
  input,
  error,
  loading,
  discount,
  onInputChange,
  onApply,
  onRemove,
}: {
  input: string
  error: string
  loading: boolean
  discount: AppliedDiscount | null
  onInputChange: (value: string) => void
  onApply: () => void
  onRemove: () => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          placeholder="Discount code"
          value={input}
          onChange={(e) => onInputChange(e.target.value.toUpperCase())}
          className="min-w-0 flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-mono text-stone-900 placeholder:font-sans placeholder:text-stone-400"
        />
        <button
          type="button"
          onClick={onApply}
          disabled={loading || !input.trim()}
          className="shrink-0 rounded-lg bg-stone-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          {loading ? '…' : 'Apply'}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {discount?.coupon_code && (
        <button type="button" onClick={onRemove} className="text-xs text-stone-500 underline">
          Remove {discount.coupon_code}
          {discount.discount_pence > 0 ? ` (−${formatPence(discount.discount_pence)})` : ''}
        </button>
      )}
    </div>
  )
}
