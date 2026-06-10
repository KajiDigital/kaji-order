'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  getBasket,
  saveBasket,
  clearBasket,
  basketSubtotal,
  itemLineTotal,
  type AppliedDiscount,
  type BasketItem,
} from '@/app/lib/basket'
import { formatPence } from '@/app/lib/utils'
import { OrderSummaryBreakdown } from '@/app/components/public/OrderSummaryBreakdown'
import { DEFAULT_SERVICE_FEE_PENCE } from '@/app/lib/service-fee'

function buildPromoItems(items: BasketItem[]) {
  return items.map((i) => ({
    menuItemId: i.menuItemId,
    categoryId: i.categoryId ?? '',
    quantity: i.quantity,
    lineTotalPence: itemLineTotal(i),
  }))
}

export default function BasketPage() {
  const params = useParams()
  const slug = params.slug as string
  const [items, setItems] = useState<BasketItem[]>([])
  const [orderNotes, setOrderNotes] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [restaurantId, setRestaurantId] = useState('')
  const [minOrder, setMinOrder] = useState(0)
  const [prepMins, setPrepMins] = useState(30)
  const [serviceFeePence, setServiceFeePence] = useState(DEFAULT_SERVICE_FEE_PENCE)
  const [canOrder, setCanOrder] = useState(true)
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null)
  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [autoMessage, setAutoMessage] = useState('')

  const persistBasket = useCallback(
    (nextItems: BasketItem[], notes: string, discount: AppliedDiscount | null) => {
      saveBasket(slug, {
        items: nextItems,
        restaurantSlug: slug,
        orderNotes: notes,
        appliedDiscount: discount,
        updatedAt: new Date().toISOString(),
      })
    },
    [slug]
  )

  const refreshDiscounts = useCallback(
    async (nextItems: BasketItem[], existing?: AppliedDiscount | null) => {
      if (!restaurantId || nextItems.length === 0) {
        setAppliedDiscount(null)
        setAutoMessage('')
        return
      }

      const subtotal = basketSubtotal(nextItems)
      const promoItems = buildPromoItems(nextItems)

      if (existing?.coupon_code) {
        const res = await fetch('/api/promotions/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug,
            code: existing.coupon_code,
            subtotal,
            items: promoItems,
          }),
        })
        const data = await res.json()
        if (data.valid) {
          const discount: AppliedDiscount = {
            promotion_id: data.promotion_id,
            coupon_code: data.coupon_code,
            discount_pence: data.discount_pence,
            description: data.description,
            discount_type: data.discount_type,
          }
          setAppliedDiscount(discount)
          setAutoMessage('')
          persistBasket(nextItems, orderNotes, discount)
          return
        }
        setAppliedDiscount(null)
        setCouponError(data.error ?? 'Coupon no longer valid')
        persistBasket(nextItems, orderNotes, null)
        return
      }

      const res = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          auto_apply: true,
          subtotal,
          items: promoItems,
        }),
      })
      const data = await res.json()
      if (data.valid && data.discount_pence > 0) {
        const discount: AppliedDiscount = {
          promotion_id: data.promotion_id,
          discount_pence: data.discount_pence,
          description: data.description,
          discount_type: data.discount_type,
          auto: true,
        }
        setAppliedDiscount(discount)
        setAutoMessage(`${data.description} applied automatically 🎉`)
        persistBasket(nextItems, orderNotes, discount)
      } else {
        setAppliedDiscount(null)
        setAutoMessage('')
        persistBasket(nextItems, orderNotes, null)
      }
    },
    [restaurantId, slug, orderNotes, persistBasket]
  )

  useEffect(() => {
    const basket = getBasket(slug)
    if (basket) {
      setItems(basket.items)
      setOrderNotes(basket.orderNotes ?? '')
      setAppliedDiscount(basket.appliedDiscount ?? null)
      if (basket.appliedDiscount?.coupon_code) {
        setCouponInput(basket.appliedDiscount.coupon_code)
      }
    }
    fetch(`/api/menu/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        setRestaurantName(d.restaurant?.name ?? '')
        setRestaurantId(d.restaurant?.id ?? '')
        setMinOrder(d.restaurant?.min_order_pence ?? 0)
        setPrepMins(d.restaurant?.avg_prep_minutes ?? 30)
        setServiceFeePence(d.restaurant?.service_fee_pence ?? DEFAULT_SERVICE_FEE_PENCE)
        setCanOrder(Boolean(d.restaurant?.canOrder))
      })
  }, [slug])

  useEffect(() => {
    if (!restaurantId || items.length === 0) return
    refreshDiscounts(items, appliedDiscount)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, items])

  function updateItems(next: BasketItem[]) {
    setItems(next)
    persistBasket(next, orderNotes, appliedDiscount)
    if (next.length === 0) {
      clearBasket(slug)
      setAppliedDiscount(null)
      setAutoMessage('')
    }
  }

  function removeItem(id: string) {
    const next = items.filter((i) => i.id !== id)
    updateItems(next)
  }

  async function applyCoupon() {
    const code = couponInput.trim()
    if (!code) return
    setCouponLoading(true)
    setCouponError('')
    setAutoMessage('')

    const subtotal = basketSubtotal(items)
    const res = await fetch('/api/promotions/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        code,
        subtotal,
        items: buildPromoItems(items),
      }),
    })
    const data = await res.json()
    setCouponLoading(false)

    if (!data.valid) {
      setCouponError(data.error ?? 'Invalid coupon code')
      return
    }

    const discount: AppliedDiscount = {
      promotion_id: data.promotion_id,
      coupon_code: data.coupon_code ?? code.toUpperCase(),
      discount_pence: data.discount_pence,
      description: data.description,
      discount_type: data.discount_type,
    }
    setAppliedDiscount(discount)
    persistBasket(items, orderNotes, discount)
  }

  function removeCoupon() {
    setCouponInput('')
    setCouponError('')
    setAppliedDiscount(null)
    persistBasket(items, orderNotes, null)
    refreshDiscounts(items, null)
  }

  const subtotal = basketSubtotal(items)
  const discountPence = appliedDiscount?.discount_pence ?? 0
  const belowMin = subtotal < minOrder
  const checkoutBlocked = belowMin || !canOrder
  const discountLabel = appliedDiscount?.coupon_code
    ? `Discount (${appliedDiscount.coupon_code})`
    : appliedDiscount?.description
      ? `Discount (${appliedDiscount.description})`
      : 'Discount'

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
              persistBasket(items, e.target.value, appliedDiscount)
            }}
            className="w-full mt-4 border rounded-xl p-3 text-sm"
            rows={2}
          />

          <div className="mt-4 bg-white rounded-xl p-4 border space-y-3">
            <div className="flex gap-2">
              <input
                placeholder="Enter coupon code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                className="flex-1 border rounded-lg px-3 py-2 text-sm font-mono"
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={couponLoading || !couponInput.trim()}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                Apply
              </button>
            </div>
            {couponError && <p className="text-red-500 text-sm">{couponError}</p>}
            {appliedDiscount?.coupon_code && (
              <button type="button" onClick={removeCoupon} className="text-xs text-slate-500">
                Remove coupon
              </button>
            )}
            {autoMessage && !appliedDiscount?.coupon_code && (
              <p className="text-emerald-600 text-sm">{autoMessage}</p>
            )}
          </div>

          <div className="mt-4 bg-white rounded-xl p-4 border">
            <p className="text-sm text-slate-600">Order type: <strong>Collection</strong></p>
            <p className="text-sm text-slate-600 mt-1">Est. ready: ~{prepMins} minutes</p>
            <div className="mt-3">
              <OrderSummaryBreakdown
                subtotal={subtotal}
                serviceFeePence={serviceFeePence}
                discountPence={discountPence}
                discountLabel={discountLabel}
              />
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
