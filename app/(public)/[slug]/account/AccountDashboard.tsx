'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatOrderNumber } from '@/app/lib/utils'
import { addItemsToBasket, type BasketItem, type BasketOrderType } from '@/app/lib/basket'

type Order = {
  id: string
  order_number: number
  status: string
  order_type: string
  total_pence: number
  created_at: string
  items: { id: string; name: string; quantity: number; total_price: number }[]
}

function formatMoney(pence: number) {
  return `£${(pence / 100).toFixed(2)}`
}

function statusStyle(status: string) {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-100 text-amber-800'
    case 'ACCEPTED':
    case 'PREPARING':
      return 'bg-sky-100 text-sky-800'
    case 'READY':
      return 'bg-emerald-100 text-emerald-800'
    case 'COLLECTED':
      return 'bg-stone-100 text-stone-600'
    case 'REJECTED':
    case 'CANCELLED':
    case 'REFUNDED':
      return 'bg-rose-100 text-rose-700'
    default:
      return 'bg-stone-100 text-stone-600'
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'PENDING':
      return 'Waiting'
    case 'ACCEPTED':
      return 'Accepted'
    case 'PREPARING':
      return 'Preparing'
    case 'READY':
      return 'Ready'
    case 'COLLECTED':
      return 'Collected'
    case 'REJECTED':
      return 'Rejected'
    case 'CANCELLED':
      return 'Cancelled'
    case 'REFUNDED':
      return 'Refunded'
    default:
      return status
  }
}

export function AccountDashboard({
  slug,
  restaurantName,
  name,
  orders,
  primary,
  mode = 'home',
  totalOrders,
}: {
  slug: string
  restaurantName: string
  name: string
  orders: Order[]
  primary: string
  mode?: 'home' | 'history'
  totalOrders?: number
}) {
  const router = useRouter()
  const [reorderingId, setReorderingId] = useState<string | null>(null)
  const [reorderNotice, setReorderNotice] = useState<{
    availableCount: number
    unavailable: { name: string; quantity: number; reason: string }[]
  } | null>(null)
  const firstName = name.split(' ')[0]

  async function reorder(orderId: string) {
    setReorderingId(orderId)
    setReorderNotice(null)
    try {
      const res = await fetch(`/api/customer/orders/${orderId}/reorder`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setReorderNotice({
          availableCount: 0,
          unavailable: [{ name: 'This order', quantity: 1, reason: data.error ?? 'Could not reorder' }],
        })
        return
      }
      const available = (data.available ?? []) as BasketItem[]
      const unavailable = (data.unavailable ?? []) as { name: string; quantity: number; reason: string }[]
      if (available.length > 0) {
        addItemsToBasket(slug, available, data.order_type as BasketOrderType)
      }
      if (unavailable.length > 0) {
        setReorderNotice({ availableCount: available.length, unavailable })
        return
      }
      router.push(available.length > 0 ? `/${slug}/basket` : `/${slug}`)
    } finally {
      setReorderingId(null)
    }
  }

  async function logout() {
    await fetch('/api/customer/logout', { method: 'POST' })
    router.push(`/${slug}`)
    router.refresh()
  }

  const allCount = totalOrders ?? orders.length
  const isHistory = mode === 'history'

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200/80">
        <div className="flex items-start gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
            style={{ backgroundColor: primary }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
              {restaurantName}
            </p>
            <h1 className="text-2xl font-bold text-stone-900">
              {isHistory ? 'Order history archive' : `Hi ${firstName}`}
            </h1>
            <p className="mt-0.5 text-sm text-stone-500">
              {isHistory
                ? `${allCount === 1 ? '1 order' : `${allCount} orders`} at ${restaurantName}`
                : restaurantName}
            </p>
          </div>
        </div>
      </section>

      {reorderNotice && (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold text-amber-950">Some dishes are not available</h2>
          <ul className="mt-3 space-y-2">
            {reorderNotice.unavailable.map((item) => (
              <li key={`${item.name}-${item.reason}`} className="text-sm text-amber-950">
                <span className="font-medium">
                  {item.quantity}× {item.name}
                </span>
                <span className="block text-amber-800">{item.reason}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {reorderNotice.availableCount > 0 && (
              <Link
                href={`/${slug}/basket`}
                className="flex-1 rounded-2xl py-2.5 text-center text-sm font-semibold text-white"
                style={{ backgroundColor: primary }}
              >
                Continue with available items
              </Link>
            )}
            <Link
              href={`/${slug}`}
              className="flex-1 rounded-2xl bg-white py-2.5 text-center text-sm font-semibold text-stone-800 ring-1 ring-amber-200"
            >
              Make a new order
            </Link>
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-semibold text-stone-900">
            {isHistory ? 'All orders' : 'Latest order'}
          </h2>
          <span className="text-xs text-stone-400">
            {allCount === 1 ? '1 order' : `${allCount} orders`}
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-3xl bg-white px-5 py-10 text-center shadow-sm ring-1 ring-stone-200/80">
            <p className="text-sm font-medium text-stone-800">No orders yet</p>
            <p className="mt-1 text-sm text-stone-500">
              Your past orders at {restaurantName} will show up here.
            </p>
            <Link
              href={`/${slug}`}
              className="mt-4 inline-flex rounded-full px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: primary }}
            >
              Browse the menu
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <article
                key={order.id}
                className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-stone-200/80"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-stone-900">
                      {formatOrderNumber(order.order_number)}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-500">
                      {new Date(order.created_at).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' · '}
                      {order.order_type === 'DELIVERY' ? 'Delivery' : 'Collection'}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyle(order.status)}`}
                  >
                    {statusLabel(order.status)}
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-stone-600">
                  {order.items.map((item) => `${item.quantity}× ${item.name}`).join(' · ')}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="mr-auto text-sm font-semibold" style={{ color: primary }}>
                    {formatMoney(order.total_pence)}
                  </span>
                  <Link
                    href={`/${slug}/confirmation/${order.id}`}
                    className="cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium text-stone-600 ring-1 ring-stone-200"
                  >
                    Receipt
                  </Link>
                  <button
                    type="button"
                    onClick={() => void reorder(order.id)}
                    disabled={reorderingId === order.id}
                    className="cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: primary }}
                  >
                    {reorderingId === order.id ? 'Checking...' : 'Reorder'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {!isHistory && allCount > 0 && (
          <Link
            href={`/${slug}/account/history`}
            className="mt-4 flex w-full cursor-pointer items-center justify-center rounded-2xl py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: primary }}
          >
            View all history
          </Link>
        )}
      </section>

      <div className="pb-6">
        <button
          type="button"
          onClick={logout}
          className="w-full cursor-pointer rounded-2xl bg-white px-4 py-3 text-sm font-medium text-stone-700 shadow-sm ring-1 ring-stone-200"
        >
          Log out
        </button>
      </div>
    </div>
  )
}
