'use client'

import Link from 'next/link'
import { formatPence } from '@/app/lib/utils'
import { formatSelectionsLines } from '@/app/lib/menu-selections'
import {
  basketItemCount,
  basketSubtotal,
  itemLineTotal,
  type BasketItem,
  type BasketOrderType,
} from '@/app/lib/basket'
import { DeliveryAddressPicker } from './DeliveryAddressPicker'

type Props = {
  slug: string
  items: BasketItem[]
  primary: string
  minOrderPence: number
  orderType: BasketOrderType
  onOrderTypeChange: (type: BasketOrderType) => void
  collectionEnabled?: boolean
  deliveryEnabled?: boolean
  deliveryAvailableNow?: boolean
  deliveryFeePence?: number
  deliveryPostcode?: string
  deliveryAddress?: string
  onDeliveryPostcodeChange?: (postcode: string) => void
  onDeliveryAddressSelect?: (address: string, postcode: string) => void
  onDeliveryValidationChange?: (valid: boolean, feePence: number, minOrderPence: number) => void
  deliveryReady?: boolean
  onUpdateQty: (id: string, qty: number) => void
  onRemove: (id: string) => void
  compact?: boolean
  checkoutDisabled?: boolean
}

export function CartPanel({
  slug,
  items,
  primary,
  minOrderPence,
  orderType,
  onOrderTypeChange,
  collectionEnabled = true,
  deliveryEnabled = false,
  deliveryAvailableNow = true,
  deliveryFeePence = 0,
  deliveryPostcode = '',
  deliveryAddress = '',
  onDeliveryPostcodeChange,
  onDeliveryAddressSelect,
  onDeliveryValidationChange,
  deliveryReady = false,
  onUpdateQty,
  onRemove,
  compact,
  checkoutDisabled,
}: Props) {
  const count = basketItemCount(items)
  const subtotal = basketSubtotal(items)
  const effectiveMin =
    orderType === 'delivery' ? minOrderPence : minOrderPence
  const belowMin = subtotal < effectiveMin && effectiveMin > 0
  const showOrderTypePicker = collectionEnabled && deliveryEnabled && deliveryAvailableNow
  const deliveryBlocked = orderType === 'delivery' && !deliveryReady
  const checkoutBlocked = belowMin || checkoutDisabled || deliveryBlocked

  return (
    <div className={`flex flex-col ${compact ? '' : 'h-full'}`}>
      {(showOrderTypePicker || deliveryEnabled || collectionEnabled) && (
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Order type</p>
          {showOrderTypePicker ? (
            <div className="mt-2 flex rounded-lg border border-stone-200 p-0.5">
              {deliveryEnabled && deliveryAvailableNow && (
                <button
                  type="button"
                  onClick={() => onOrderTypeChange('delivery')}
                  className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors ${
                    orderType === 'delivery' ? 'text-white' : 'text-stone-600 hover:bg-stone-50'
                  }`}
                  style={orderType === 'delivery' ? { backgroundColor: primary } : undefined}
                >
                  Delivery
                </button>
              )}
              {collectionEnabled && (
                <button
                  type="button"
                  onClick={() => onOrderTypeChange('collection')}
                  className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors ${
                    orderType === 'collection' ? 'text-white' : 'text-stone-600 hover:bg-stone-50'
                  }`}
                  style={orderType === 'collection' ? { backgroundColor: primary } : undefined}
                >
                  Collection
                </button>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm font-medium text-stone-800">
              {deliveryEnabled && !collectionEnabled
                ? 'Delivery'
                : collectionEnabled && !deliveryEnabled
                  ? 'Collection only'
                  : collectionEnabled
                    ? 'Collection'
                    : 'Delivery'}
            </p>
          )}

          {orderType === 'delivery' && onDeliveryPostcodeChange && onDeliveryAddressSelect && (
            <DeliveryAddressPicker
              slug={slug}
              primary={primary}
              postcode={deliveryPostcode}
              selectedAddress={deliveryAddress}
              feePence={deliveryFeePence}
              onPostcodeChange={onDeliveryPostcodeChange}
              onAddressSelect={onDeliveryAddressSelect}
              onValidationChange={onDeliveryValidationChange}
            />
          )}
        </div>
      )}

      <div className="mt-4 flex-1 rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 px-4 py-3">
          <h2 className="font-bold text-stone-900">
            Your Cart ({count} {count === 1 ? 'item' : 'items'})
          </h2>
        </div>

        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-stone-400">
            Your cart is empty. Add items to get started.
          </p>
        ) : (
          <ul className="max-h-64 overflow-y-auto px-4 py-2 lg:max-h-80">
            {items.map((item) => (
              <li key={item.id} className="border-b border-stone-50 py-3 last:border-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-900">{item.name}</p>
                    {formatSelectionsLines(item.selections).map((line, i) => (
                      <p key={i} className="text-xs text-stone-500 pl-1">
                        {line}
                      </p>
                    ))}
                    <p className="mt-0.5 text-sm font-semibold" style={{ color: primary }}>
                      {formatPence(itemLineTotal(item))}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-stone-200 text-sm hover:bg-stone-50"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-stone-200 text-sm hover:bg-stone-50"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      className="ml-1 flex h-7 w-7 items-center justify-center rounded-md text-red-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove item"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {items.length > 0 && (
          <div className="border-t border-stone-100 px-4 py-4">
            <div className="flex justify-between text-sm text-stone-600">
              <span>Subtotal</span>
              <span className="font-semibold text-stone-900">{formatPence(subtotal)}</span>
            </div>
            {orderType === 'delivery' && deliveryFeePence > 0 && (
              <div className="mt-1 flex justify-between text-sm text-stone-600">
                <span>Delivery</span>
                <span>{formatPence(deliveryFeePence)}</span>
              </div>
            )}
            {belowMin && (
              <p className="mt-2 text-xs text-red-500">Minimum order is {formatPence(effectiveMin)}</p>
            )}
            {deliveryBlocked && (
              <p className="mt-2 text-xs text-amber-700">
                Select your delivery address to continue
              </p>
            )}
            {checkoutDisabled ? (
              <p className="mt-3 rounded-xl bg-stone-100 px-3 py-3 text-center text-xs font-medium text-stone-500">
                Checkout disabled in preview
              </p>
            ) : (
              <Link
                href={checkoutBlocked ? '#' : `/${slug}/checkout`}
                className={`mt-3 flex w-full items-center justify-center gap-1 rounded-xl py-3 text-sm font-semibold text-white ${
                  checkoutBlocked ? 'pointer-events-none opacity-50' : ''
                }`}
                style={{ backgroundColor: primary }}
              >
                Go to checkout
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
