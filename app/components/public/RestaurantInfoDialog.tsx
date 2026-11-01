'use client'

import type { ReactNode } from 'react'
import { DAYS, formatPence } from '@/app/lib/utils'
import { formatTime12h, parseOpeningHours } from '@/app/lib/opening-hours'
import { fulfillmentSummaryLabel } from '@/app/lib/fulfillment'
import type { Restaurant } from './menu-types'

function todayKey(): (typeof DAYS)[number] {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/London',
    weekday: 'long',
  })
    .format(new Date())
    .toLowerCase()
  return (DAYS as readonly string[]).includes(weekday)
    ? (weekday as (typeof DAYS)[number])
    : 'monday'
}

const DAY_SHORT: Record<(typeof DAYS)[number], string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
}

export function RestaurantInfoDialog({
  restaurant,
  primary,
  onClose,
}: {
  restaurant: Restaurant
  primary: string
  onClose: () => void
}) {
  const collectionEnabled = restaurant.collection_enabled !== false
  const deliveryEnabled = Boolean(restaurant.delivery_enabled)
  const hours = parseOpeningHours(restaurant.opening_hours)
  const today = todayKey()
  const orderType = fulfillmentSummaryLabel(collectionEnabled, deliveryEnabled)
  const addressLine = [restaurant.address, restaurant.postcode].filter(Boolean).join(', ')
  const collectionMin = restaurant.min_order_pence ?? 0
  const deliveryMin = restaurant.delivery_minimum_pence ?? 0
  const deliveryFee = restaurant.delivery_fee_pence ?? 0
  const showCollectionMin = collectionEnabled && collectionMin > 0
  const showDeliveryMin = deliveryEnabled && deliveryMin > 0
  const showDeliveryFee = deliveryEnabled && deliveryFee > 0

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-3 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close restaurant information"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-labelledby="restaurant-info-title"
        className="relative z-10 w-full max-w-xl rounded-2xl bg-white px-5 py-6 shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-5 px-6 text-center">
          <h2 id="restaurant-info-title" className="text-lg font-bold text-stone-900">
            {restaurant.name}
          </h2>
          {restaurant.description && (
            <p className="mt-1 text-sm text-stone-500">{restaurant.description}</p>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2.5 text-sm">
            {addressLine && <CompactRow label="Address" value={addressLine} />}
            {restaurant.phone && (
              <CompactRow
                label="Phone"
                value={
                  <a href={`tel:${restaurant.phone}`} className="font-medium underline" style={{ color: primary }}>
                    {restaurant.phone}
                  </a>
                }
              />
            )}
            {restaurant.email && (
              <CompactRow
                label="Email"
                value={
                  <a href={`mailto:${restaurant.email}`} className="font-medium underline" style={{ color: primary }}>
                    {restaurant.email}
                  </a>
                }
              />
            )}
            <CompactRow label="Ordering" value={orderType} />
            {showCollectionMin && (
              <CompactRow label="Min collection" value={formatPence(collectionMin)} />
            )}
            {showDeliveryMin && (
              <CompactRow label="Min delivery" value={formatPence(deliveryMin)} />
            )}
            {showDeliveryFee && (
              <CompactRow label="Delivery fee" value={formatPence(deliveryFee)} />
            )}
            {deliveryEnabled && restaurant.delivery_from && (
              <CompactRow
                label="Delivery hours"
                value={
                  restaurant.delivery_until
                    ? `${formatTime12h(restaurant.delivery_from)} – ${formatTime12h(restaurant.delivery_until)}`
                    : `From ${formatTime12h(restaurant.delivery_from)}`
                }
              />
            )}
            <CompactRow label="Prep time" value={`${restaurant.avg_prep_minutes} min`} />
            {restaurant.phone && (
              <a
                href={`tel:${restaurant.phone}`}
                className="mt-3 inline-flex rounded-lg px-3 py-2 text-xs font-semibold text-white"
                style={{ backgroundColor: primary }}
              >
                Call now
              </a>
            )}
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
              Opening times
            </p>
            <ul className="text-sm">
              {DAYS.map((day) => {
                const entry = hours[day]
                const isToday = day === today
                return (
                  <li
                    key={day}
                    className={`flex items-center justify-between py-1 ${
                      isToday ? 'font-semibold text-stone-900' : 'text-stone-600'
                    }`}
                  >
                    <span>
                      {DAY_SHORT[day]}
                      {isToday ? ' · today' : ''}
                    </span>
                    <span>
                      {entry.open
                        ? `${formatTime12h(entry.openTime)}–${formatTime12h(entry.closeTime)}`
                        : 'Closed'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function CompactRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
        {label}
      </span>
      <span className="text-right text-stone-800">{value}</span>
    </div>
  )
}
