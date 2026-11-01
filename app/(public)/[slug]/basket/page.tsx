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
import { formatSelectionsLines } from '@/app/lib/menu-selections'
import { DEFAULT_SERVICE_FEE_PENCE } from '@/app/lib/service-fee'
import { basketOrderTypeLabel } from '@/app/lib/fulfillment'
import {
  discountFromValidation,
  discountLabel,
  promotionNotice,
  validateBasketPromotion,
} from '@/app/lib/basket-promotions'

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
  const [collectionEnabled, setCollectionEnabled] = useState(true)
  const [deliveryEnabled, setDeliveryEnabled] = useState(false)
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null)
  const [autoMessage, setAutoMessage] = useState('')
  const [promoHints, setPromoHints] = useState<string[]>([])
  const [freeItemClaim, setFreeItemClaim] = useState<{
    itemId: string
    itemName: string
    base_price: number
  } | null>(null)

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

  const fetchHints = useCallback(
    async (nextItems: BasketItem[]) => {
      if (!restaurantId) return
      const data = await validateBasketPromotion({ slug, items: nextItems, hints: true })
      setPromoHints(data.hints ?? [])
    },
    [restaurantId, slug]
  )

  const refreshDiscounts = useCallback(
    async (nextItems: BasketItem[], existing?: AppliedDiscount | null) => {
      if (!restaurantId || nextItems.length === 0) {
        setAppliedDiscount(null)
        setAutoMessage('')
        return
      }

      const data = existing?.coupon_code
        ? await validateBasketPromotion({
            slug,
            items: nextItems,
            code: existing.coupon_code,
          })
        : await validateBasketPromotion({ slug, items: nextItems, autoApply: true })

      const discount = discountFromValidation(data, existing?.coupon_code)
      setAppliedDiscount(discount)
      setAutoMessage(discount ? promotionNotice(data) : '')
      persistBasket(nextItems, orderNotes, discount)

      const freeData = await validateBasketPromotion({
        slug,
        items: nextItems,
        checkFreeItem: true,
      })
      if (freeData.qualified && freeData.free_item_id) {
        const hasItem = nextItems.some((i) => i.menuItemId === freeData.free_item_id)
        if (!hasItem) {
          fetch(`/api/menu/${slug}`)
            .then((r) => r.json())
            .then((menu) => {
              for (const cat of menu.categories ?? []) {
                const item = cat.items?.find((i: { id: string }) => i.id === freeData.free_item_id)
                if (item) {
                  setFreeItemClaim({
                    itemId: item.id,
                    itemName: item.name,
                    base_price: item.base_price,
                  })
                  break
                }
              }
            })
        } else {
          setFreeItemClaim(null)
        }
      } else {
        setFreeItemClaim(null)
      }

      fetchHints(nextItems)
    },
    [restaurantId, slug, orderNotes, persistBasket, fetchHints]
  )

  useEffect(() => {
    const basket = getBasket(slug)
    if (basket) {
      setItems(basket.items)
      setOrderNotes(basket.orderNotes ?? '')
      setAppliedDiscount(basket.appliedDiscount ?? null)
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
        setCollectionEnabled(d.restaurant?.collection_enabled !== false)
        setDeliveryEnabled(Boolean(d.restaurant?.delivery_enabled))
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

  function claimFreeItem() {
    if (!freeItemClaim) return
    const newItem: BasketItem = {
      id: `${freeItemClaim.itemId}-free-${Date.now()}`,
      menuItemId: freeItemClaim.itemId,
      name: freeItemClaim.itemName,
      base_price: freeItemClaim.base_price,
      quantity: 1,
      selections: [],
      options_price: 0,
      total_price: freeItemClaim.base_price,
    }
    const next = [...items, newItem]
    setItems(next)
    setFreeItemClaim(null)
    persistBasket(next, orderNotes, appliedDiscount)
  }

  const subtotal = basketSubtotal(items)
  const discountPence = appliedDiscount?.discount_pence ?? 0
  const belowMin = subtotal < minOrder
  const checkoutBlocked = belowMin || !canOrder
  const appliedDiscountLabel = discountLabel(appliedDiscount)

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
                    {formatSelectionsLines(item.selections).map((line, i) => (
                      <p key={i} className="text-xs text-slate-500 pl-1">{line}</p>
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
            className="mt-4 w-full rounded-xl border bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400"
            rows={2}
          />

          {autoMessage && (
            <p className="mt-4 text-sm text-emerald-600">{autoMessage}</p>
          )}

          {promoHints.length > 0 && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
              {promoHints.map((hint) => (
                <p key={hint} className="text-sm text-amber-900">
                  {hint}
                </p>
              ))}
            </div>
          )}

          {freeItemClaim && (
            <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-sm text-emerald-900 font-medium">
                🎉 You qualify for free {freeItemClaim.itemName}!
              </p>
              <button
                type="button"
                onClick={claimFreeItem}
                className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm"
              >
                Claim free {freeItemClaim.itemName}
              </button>
            </div>
          )}

          <div className="mt-4 bg-white rounded-xl p-4 border">
            <p className="text-sm text-slate-600">
              Order type:{' '}
              <strong>{basketOrderTypeLabel(collectionEnabled, deliveryEnabled)}</strong>
            </p>
            <p className="text-sm text-slate-600 mt-1">Est. ready: ~{prepMins} minutes</p>
            <div className="mt-3">
              <OrderSummaryBreakdown
                subtotal={subtotal}
                serviceFeePence={serviceFeePence}
                discountPence={discountPence}
                discountLabel={appliedDiscountLabel}
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
