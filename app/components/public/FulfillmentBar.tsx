'use client'

import type { BasketOrderType } from '@/app/lib/basket'
import { formatPence } from '@/app/lib/utils'

type Props = {
  orderType: BasketOrderType
  primary: string
  collectionEnabled: boolean
  deliveryEnabled: boolean
  deliveryAvailableNow: boolean
  deliveryWindowMessage?: string
  deliveryFeePence?: number
  avgPrepMinutes?: number
  deliveryAddress?: string
  onChange: () => void
}

export function FulfillmentBar({
  orderType,
  primary,
  collectionEnabled,
  deliveryEnabled,
  deliveryAvailableNow,
  deliveryWindowMessage,
  deliveryFeePence = 0,
  avgPrepMinutes = 30,
  deliveryAddress,
  onChange,
}: Props) {
  const canChange =
    (collectionEnabled && deliveryEnabled && deliveryAvailableNow) ||
    (collectionEnabled && deliveryEnabled && !deliveryAvailableNow) ||
    (collectionEnabled && deliveryEnabled)

  const isDelivery = orderType === 'delivery'

  let subtitle = ''
  if (isDelivery) {
    subtitle = deliveryAddress
      ? deliveryAddress
      : deliveryFeePence > 0
        ? `Delivery · ${formatPence(deliveryFeePence)}`
        : 'Delivery to your door'
  } else if (collectionEnabled) {
    subtitle = `Pick up in store · ready in ~${avgPrepMinutes} min`
  } else {
    subtitle = 'Collection'
  }

  if (!collectionEnabled && deliveryEnabled) {
    subtitle = deliveryAddress || 'Delivery to your door'
  }

  if (collectionEnabled && !deliveryEnabled) {
    subtitle = `Collection only · ready in ~${avgPrepMinutes} min`
  }

  return (
    <div className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <span className="text-xl" aria-hidden>
          {isDelivery ? '🛵' : '🏪'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-stone-900">
            {isDelivery ? 'Delivery' : 'Collection'}
            {collectionEnabled && !deliveryEnabled && (
              <span className="ml-2 text-xs font-medium text-stone-500">(only option)</span>
            )}
          </p>
          <p className="truncate text-xs text-stone-500">{subtitle}</p>
          {deliveryEnabled && !deliveryAvailableNow && deliveryWindowMessage && !isDelivery && (
            <p className="mt-0.5 text-xs text-amber-700">{deliveryWindowMessage}</p>
          )}
        </div>
        {canChange && (
          <button
            type="button"
            onClick={onChange}
            className="shrink-0 text-sm font-semibold"
            style={{ color: primary }}
          >
            Change
          </button>
        )}
      </div>
    </div>
  )
}
