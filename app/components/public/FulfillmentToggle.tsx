'use client'

import type { BasketOrderType } from '@/app/lib/basket'

export function FulfillmentToggle({
  orderType,
  primary,
  collectionEnabled,
  deliveryEnabled,
  deliveryAvailableNow,
  deliveryWindowMessage,
  onChange,
}: {
  orderType: BasketOrderType
  primary: string
  collectionEnabled: boolean
  deliveryEnabled: boolean
  deliveryAvailableNow: boolean
  deliveryWindowMessage?: string
  onChange: (type: BasketOrderType) => void
}) {
  if (!collectionEnabled || !deliveryEnabled) return null

  return (
    <div>
      <div className="flex rounded-2xl bg-stone-100 p-1">
        <button
          type="button"
          onClick={() => onChange('delivery')}
          disabled={!deliveryAvailableNow}
          className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-colors ${
            orderType === 'delivery' ? 'text-white shadow-sm' : 'text-stone-500'
          } disabled:cursor-not-allowed disabled:opacity-50`}
          style={orderType === 'delivery' ? { backgroundColor: primary } : undefined}
        >
          Delivery
        </button>
        <button
          type="button"
          onClick={() => onChange('collection')}
          className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-colors ${
            orderType === 'collection' ? 'text-white shadow-sm' : 'text-stone-500'
          }`}
          style={orderType === 'collection' ? { backgroundColor: primary } : undefined}
        >
          Collection
        </button>
      </div>
      {deliveryEnabled && !deliveryAvailableNow && deliveryWindowMessage && (
        <p className="mt-2 px-1 text-xs text-amber-700">{deliveryWindowMessage}</p>
      )}
    </div>
  )
}
