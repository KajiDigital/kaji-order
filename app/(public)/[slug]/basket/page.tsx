'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  getBasket,
  saveBasket,
  clearBasket,
  basketSubtotal,
  itemLineTotal,
  type BasketItem,
} from '@/app/lib/basket'
import { formatPence } from '@/app/lib/utils'
import { OrderSummaryBreakdown } from '@/app/components/public/OrderSummaryBreakdown'
import { DEFAULT_SERVICE_FEE_PENCE } from '@/app/lib/service-fee'

export default function BasketPage() {
  const params = useParams()
  const slug = params.slug as string
  const [items, setItems] = useState<BasketItem[]>([])
  const [orderNotes, setOrderNotes] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [minOrder, setMinOrder] = useState(0)
  const [prepMins, setPrepMins] = useState(30)
  const [serviceFeePence, setServiceFeePence] = useState(DEFAULT_SERVICE_FEE_PENCE)
  const [canOrder, setCanOrder] = useState(true)

  useEffect(() => {
    const basket = getBasket(slug)
    if (basket) {
      setItems(basket.items)
      setOrderNotes(basket.orderNotes ?? '')
    }
    fetch(`/api/menu/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        setRestaurantName(d.restaurant?.name ?? '')
        setMinOrder(d.restaurant?.min_order_pence ?? 0)
        setPrepMins(d.restaurant?.avg_prep_minutes ?? 30)
        setServiceFeePence(d.restaurant?.service_fee_pence ?? DEFAULT_SERVICE_FEE_PENCE)
        setCanOrder(Boolean(d.restaurant?.canOrder))
      })
  }, [slug])

  function updateItems(next: BasketItem[]) {
    setItems(next)
    saveBasket(slug, { items: next, restaurantSlug: slug, orderNotes, updatedAt: new Date().toISOString() })
  }

  function removeItem(id: string) {
    const next = items.filter((i) => i.id !== id)
    updateItems(next)
    if (next.length === 0) clearBasket(slug)
  }

  const subtotal = basketSubtotal(items)
  const belowMin = subtotal < minOrder
  const checkoutBlocked = belowMin || !canOrder

  return (
    <div className="min-h-screen bg-slate-50 p-4 max-w-lg mx-auto">
      <Link href={`/${slug}`} className="text-sm text-violet-600">← Continue shopping</Link>
      <h1 className="text-2xl font-bold text-slate-900 mt-4">{restaurantName || 'Your basket'}</h1>

      {items.length === 0 ? (
        <p className="text-slate-500 mt-8">Your basket is empty.</p>
      ) : (
        <>
          <ul className="mt-6 space-y-3">
            {items.map((item) => (
              <li key={item.id} className="bg-white rounded-xl p-4 border">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{item.quantity}x {item.name}</p>
                    {item.modifiers.map((m) => (
                      <p key={m.modifierId} className="text-xs text-slate-500">{m.name}</p>
                    ))}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPence(itemLineTotal(item))}</p>
                    <button type="button" onClick={() => removeItem(item.id)} className="text-xs text-red-500 mt-1">Remove</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <textarea
            placeholder="Order notes"
            value={orderNotes}
            onChange={(e) => {
              setOrderNotes(e.target.value)
              saveBasket(slug, { items, restaurantSlug: slug, orderNotes: e.target.value, updatedAt: new Date().toISOString() })
            }}
            className="w-full mt-4 border rounded-xl p-3 text-sm"
            rows={2}
          />

          <div className="mt-4 bg-white rounded-xl p-4 border">
            <p className="text-sm text-slate-600">Order type: <strong>Collection</strong></p>
            <p className="text-sm text-slate-600 mt-1">Est. ready: ~{prepMins} minutes</p>
            <div className="mt-3">
              <OrderSummaryBreakdown subtotal={subtotal} serviceFeePence={serviceFeePence} />
            </div>
            {belowMin && (
              <p className="text-red-500 text-sm mt-2">
                Minimum order is {formatPence(minOrder)}
              </p>
            )}
            {!canOrder && (
              <p className="text-amber-700 text-sm mt-2">
                Checkout is unavailable right now. You can browse the menu on the restaurant page.
              </p>
            )}
          </div>

          <Link
            href={checkoutBlocked ? '#' : `/${slug}/checkout`}
            className={`block mt-4 text-center py-3 rounded-xl font-medium text-white ${checkoutBlocked ? 'bg-slate-300 pointer-events-none' : 'bg-violet-600'}`}
          >
            Proceed to checkout
          </Link>
        </>
      )}
    </div>
  )
}
