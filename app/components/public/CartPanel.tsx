'use client'

import Link from 'next/link'
import { formatPence } from '@/app/lib/utils'
import { formatSelectionsLines } from '@/app/lib/menu-selections'
import {
  basketItemCount,
  basketSubtotal,
  itemLineTotal,
  type BasketItem,
} from '@/app/lib/basket'

type Props = {
  slug: string
  items: BasketItem[]
  primary: string
  minOrderPence: number
  orderType: 'collection' | 'delivery'
  onOrderTypeChange: (type: 'collection' | 'delivery') => void
  onUpdateQty: (id: string, qty: number) => void
  onRemove: (id: string) => void
  compact?: boolean
}

export function CartPanel({
  slug,
  items,
  primary,
  minOrderPence,
  orderType,
  onOrderTypeChange,
  onUpdateQty,
  onRemove,
  compact,
}: Props) {
  const count = basketItemCount(items)
  const subtotal = basketSubtotal(items)
  const belowMin = subtotal < minOrderPence && minOrderPence > 0

  return (
    <div className={`flex flex-col ${compact ? '' : 'h-full'}`}>
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Order type</p>
        <div className="mt-2 flex rounded-lg border border-stone-200 p-0.5">
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
        </div>
        {orderType === 'delivery' && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Delivery coming soon — please select collection for now.
          </p>
        )}
      </div>

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
            {belowMin && (
              <p className="mt-2 text-xs text-red-500">Minimum order is {formatPence(minOrderPence)}</p>
            )}
            <Link
              href={belowMin || orderType === 'delivery' ? '#' : `/${slug}/checkout`}
              className={`mt-3 flex w-full items-center justify-center gap-1 rounded-xl py-3 text-sm font-semibold text-white ${
                belowMin || orderType === 'delivery' ? 'pointer-events-none opacity-50' : ''
              }`}
              style={{ backgroundColor: primary }}
            >
              Go to checkout
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
