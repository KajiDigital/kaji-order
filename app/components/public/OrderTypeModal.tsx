'use client'

import type { BasketOrderType } from '@/app/lib/basket'
import { formatPence } from '@/app/lib/utils'
import { DeliveryAddressPicker } from './DeliveryAddressPicker'

type Props = {
  open: boolean
  primary: string
  collectionEnabled: boolean
  deliveryEnabled: boolean
  deliveryAvailableNow: boolean
  deliveryWindowMessage?: string
  deliveryFeePence?: number
  avgPrepMinutes?: number
  onSelect: (type: BasketOrderType) => void
  onClose?: () => void
  collectionOnly?: boolean
  step?: 'choose' | 'address'
  onBack?: () => void
  slug?: string
  deliveryPostcode?: string
  deliveryAddress?: string
  onDeliveryPostcodeChange?: (postcode: string) => void
  onDeliveryAddressSelect?: (address: string, postcode: string) => void
  onDeliveryValidationChange?: (valid: boolean, feePence: number, minOrderPence: number) => void
  onAddressConfirmed?: (address: string, postcode: string) => void
}

export function OrderTypeModal({
  open,
  primary,
  collectionEnabled,
  deliveryEnabled,
  deliveryAvailableNow,
  deliveryWindowMessage,
  deliveryFeePence = 0,
  avgPrepMinutes = 30,
  onSelect,
  onClose,
  collectionOnly,
  step = 'choose',
  onBack,
  slug = '',
  deliveryPostcode = '',
  deliveryAddress = '',
  onDeliveryPostcodeChange,
  onDeliveryAddressSelect,
  onDeliveryValidationChange,
  onAddressConfirmed,
}: Props) {
  if (!open) return null

  const showDelivery = deliveryEnabled && deliveryAvailableNow && !collectionOnly
  const showCollection = collectionEnabled
  const showBoth = showDelivery && showCollection
  const askingForAddress = step === 'address' && showDelivery

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 p-4 sm:items-center"
      onClick={askingForAddress && showCollection ? onBack : onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="order-type-title"
      >
        <h2 id="order-type-title" className="text-xl font-bold text-stone-900">
          {askingForAddress
            ? 'Where should we deliver?'
            : collectionOnly
              ? 'Collection only'
              : 'How would you like your order?'}
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          {askingForAddress
            ? 'Enter the address and we will check we can deliver there.'
            : collectionOnly
              ? 'Delivery is not available right now. You can collect in store.'
              : showBoth
                ? 'Choose delivery to your door or collection in store.'
                : showDelivery
                  ? 'We deliver to your door.'
                  : 'Pick up your order in store.'}
        </p>

        {!collectionOnly && deliveryEnabled && !deliveryAvailableNow && deliveryWindowMessage && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {deliveryWindowMessage}
          </p>
        )}

        {askingForAddress && onDeliveryPostcodeChange && onDeliveryAddressSelect && (
          <>
            <DeliveryAddressPicker
              embedded
              slug={slug}
              primary={primary}
              postcode={deliveryPostcode}
              selectedAddress={deliveryAddress}
              feePence={deliveryFeePence}
              onPostcodeChange={onDeliveryPostcodeChange}
              onAddressSelect={onDeliveryAddressSelect}
              onValidationChange={onDeliveryValidationChange}
              onConfirmed={onAddressConfirmed}
            />
            {showCollection && onBack && (
              <button
                type="button"
                onClick={onBack}
                className="mt-4 w-full text-sm font-medium text-stone-500 underline"
              >
                Back
              </button>
            )}
          </>
        )}

        {!askingForAddress && (
        <div className={`mt-5 grid gap-3 ${showBoth ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {showDelivery && (
            <button
              type="button"
              onClick={() => onSelect('delivery')}
              className="flex flex-col items-center rounded-xl border-2 border-stone-200 px-4 py-5 text-center transition-colors hover:border-stone-300"
            >
              <span className="text-3xl" aria-hidden>
                🛵
              </span>
              <span className="mt-2 font-bold text-stone-900">Delivery</span>
              <span className="mt-0.5 text-xs text-stone-500">To your door</span>
              {deliveryFeePence > 0 && (
                <span className="mt-1 text-xs font-medium" style={{ color: primary }}>
                  {formatPence(deliveryFeePence)} fee
                </span>
              )}
            </button>
          )}

          {showCollection && (
            <button
              type="button"
              onClick={() => onSelect('collection')}
              className="flex flex-col items-center rounded-xl border-2 border-stone-200 px-4 py-5 text-center transition-colors hover:border-stone-300"
            >
              <span className="text-3xl" aria-hidden>
                🏪
              </span>
              <span className="mt-2 font-bold text-stone-900">Collection</span>
              <span className="mt-0.5 text-xs text-stone-500">
                Ready in ~{avgPrepMinutes} min
              </span>
            </button>
          )}
        </div>
        )}
      </div>
    </div>
  )
}
