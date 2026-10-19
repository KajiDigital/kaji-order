'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import {
  getBasket,
  clearBasket,
  saveBasket,
  basketSubtotal,
  type AppliedDiscount,
  type BasketItem,
  type BasketOrderType,
} from '@/app/lib/basket'
import { formatPence } from '@/app/lib/utils'
import { OrderSummaryBreakdown } from '@/app/components/public/OrderSummaryBreakdown'
import { itemLineTotal } from '@/app/lib/basket'
import { DEFAULT_SERVICE_FEE_PENCE } from '@/app/lib/service-fee'

function CheckoutForm({
  orderId,
  slug,
  total,
  orderMode,
}: {
  orderId: string
  slug: string
  total: number
  orderMode: string
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const successPath =
    orderMode === 'manual'
      ? `/${slug}/waiting/${orderId}`
      : `/${slug}/confirmation/${orderId}`

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError('')

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}${successPath}` },
      redirect: 'if_required',
    })

    setLoading(false)
    if (submitError) {
      setError(submitError.message ?? 'Payment failed')
      return
    }

    clearBasket(slug)
    router.push(successPath)
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-3 bg-violet-600 text-white rounded-xl font-medium disabled:opacity-50"
      >
        {loading ? 'Processing...' : `Place order ${formatPence(total)}`}
      </button>
    </form>
  )
}

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [items, setItems] = useState<BasketItem[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [orderType, setOrderType] = useState<BasketOrderType>('collection')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryPostcode, setDeliveryPostcode] = useState('')
  const [collectionEnabled, setCollectionEnabled] = useState(true)
  const [deliveryEnabled, setDeliveryEnabled] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [orderMode, setOrderMode] = useState('instant')
  const [loading, setLoading] = useState(false)
  const [serviceFeePence, setServiceFeePence] = useState(DEFAULT_SERVICE_FEE_PENCE)
  const [deliveryFeePence, setDeliveryFeePence] = useState(0)
  const [isPreorderMode, setIsPreorderMode] = useState(false)
  const [nextOpenTime, setNextOpenTime] = useState<string | null>(null)
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null)
  const [deliveryValidating, setDeliveryValidating] = useState(false)
  const [deliveryError, setDeliveryError] = useState('')
  const [deliveryValidated, setDeliveryValidated] = useState(false)
  const [deliveryMinOrder, setDeliveryMinOrder] = useState(0)

  const validateDeliveryPostcode = useCallback(
    async (postcode: string) => {
      const trimmed = postcode.trim()
      if (!trimmed) {
        setDeliveryError('')
        setDeliveryValidated(false)
        setDeliveryFeePence(0)
        return
      }

      setDeliveryValidating(true)
      setDeliveryError('')
      try {
        const res = await fetch('/api/delivery/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, postcode: trimmed }),
        })
        const data = await res.json()
        if (!data.valid) {
          setDeliveryError(data.error ?? 'Delivery not available to this postcode')
          setDeliveryValidated(false)
          setDeliveryFeePence(0)
          setDeliveryMinOrder(0)
          return
        }
        setDeliveryValidated(true)
        setDeliveryFeePence(data.fee_pence ?? 0)
        setDeliveryMinOrder(data.minimum_order_pence ?? 0)
      } catch {
        setDeliveryError('Could not verify postcode. Try again.')
        setDeliveryValidated(false)
      } finally {
        setDeliveryValidating(false)
      }
    },
    [slug]
  )

  useEffect(() => {
    if (orderType !== 'delivery' || !deliveryPostcode.trim()) {
      setDeliveryError('')
      setDeliveryValidated(false)
      return
    }
    const timer = window.setTimeout(() => {
      void validateDeliveryPostcode(deliveryPostcode)
    }, 400)
    return () => window.clearTimeout(timer)
  }, [orderType, deliveryPostcode, validateDeliveryPostcode])

  useEffect(() => {
    const basket = getBasket(slug)
    if (!basket?.items.length) {
      router.push(`/${slug}/basket`)
      return
    }
    setItems(basket.items)
    setNotes(basket.orderNotes ?? '')
    setAppliedDiscount(basket.appliedDiscount ?? null)
    if (basket.orderType) setOrderType(basket.orderType)
    if (basket.deliveryAddress) setDeliveryAddress(basket.deliveryAddress)
    if (basket.deliveryPostcode) setDeliveryPostcode(basket.deliveryPostcode)

    fetch(`/api/menu/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        setServiceFeePence(d.restaurant?.service_fee_pence ?? DEFAULT_SERVICE_FEE_PENCE)
        setDeliveryFeePence(d.restaurant?.delivery_fee_pence ?? 0)
        setCollectionEnabled(d.restaurant?.collection_enabled !== false)
        setDeliveryEnabled(Boolean(d.restaurant?.delivery_enabled))
        setIsPreorderMode(Boolean(d.restaurant?.isPreorderMode))
        setNextOpenTime(d.restaurant?.nextOpenTime ?? null)
        if (!d.restaurant?.canOrder) {
          router.push(`/${slug}/basket`)
        }
        if (!basket.orderType) {
          const defaultType: BasketOrderType =
            d.restaurant?.collection_enabled !== false
              ? 'collection'
              : d.restaurant?.delivery_enabled
                ? 'delivery'
                : 'collection'
          setOrderType(defaultType)
        }
      })
  }, [slug, router])

  const subtotal = basketSubtotal(items)
  const discountPence = appliedDiscount?.discount_pence ?? 0
  const activeDeliveryFee = orderType === 'delivery' ? deliveryFeePence : 0
  const total = subtotal + serviceFeePence + activeDeliveryFee - discountPence
  const discountLabel = appliedDiscount?.coupon_code
    ? `Discount (${appliedDiscount.coupon_code})`
    : appliedDiscount?.description
      ? `Discount (${appliedDiscount.description})`
      : 'Discount'

  const showOrderTypePicker = collectionEnabled && deliveryEnabled
  const deliveryFieldsRequired = orderType === 'delivery'
  const belowMin =
    deliveryFieldsRequired &&
    deliveryValidated &&
    deliveryMinOrder > 0 &&
    subtotal < deliveryMinOrder
  const canSubmit =
    name &&
    email &&
    (!deliveryFieldsRequired ||
      (deliveryAddress.trim() && deliveryPostcode.trim() && deliveryValidated && !deliveryError))

  function persistCheckoutFields(
    nextOrderType = orderType,
    nextAddress = deliveryAddress,
    nextPostcode = deliveryPostcode
  ) {
    const basket = getBasket(slug)
    if (!basket) return
    saveBasket(slug, {
      ...basket,
      orderType: nextOrderType,
      deliveryAddress: nextAddress || undefined,
      deliveryPostcode: nextPostcode || undefined,
      updatedAt: new Date().toISOString(),
    })
  }

  async function createOrder() {
    if (!canSubmit) return
    setLoading(true)

    persistCheckoutFields()

    const res = await fetch('/api/stripe/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        customer_name: name,
        customer_email: email,
        customer_phone: phone || undefined,
        notes: notes || undefined,
        order_type: orderType === 'delivery' ? 'DELIVERY' : 'COLLECTION',
        delivery_address: deliveryFieldsRequired ? deliveryAddress.trim() : undefined,
        delivery_postcode: deliveryFieldsRequired ? deliveryPostcode.trim() : undefined,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          name: i.name,
          base_price: i.base_price,
          quantity: i.quantity,
          selections: i.selections,
          notes: i.notes,
        })),
        discount_pence: discountPence,
        coupon_code: appliedDiscount?.coupon_code,
        promotion_id: appliedDiscount?.promotion_id,
        discount_description: appliedDiscount?.description,
        discount_type: appliedDiscount?.discount_type,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      alert(data.error ?? 'Failed to create order')
      return
    }

    setOrderId(data.orderId)
    setOrderMode(data.orderMode ?? 'instant')

    const successPath =
      (data.orderMode ?? 'instant') === 'manual'
        ? `/${slug}/waiting/${data.orderId}`
        : `/${slug}/confirmation/${data.orderId}`

    if (data.devMode || !data.clientSecret) {
      clearBasket(slug)
      router.push(successPath)
      return
    }

    setClientSecret(data.clientSecret)
  }

  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
        <div>
          <Link href={`/${slug}/basket`} className="text-sm text-violet-600">← Back to basket</Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-4">Checkout</h1>
          {isPreorderMode && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Pre-order — your order will be prepared when we open
              {nextOpenTime ? ` at ${nextOpenTime}` : ''}.
            </div>
          )}

          <div className="mt-6 space-y-4">
            {(showOrderTypePicker || deliveryEnabled || collectionEnabled) && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Order type</p>
                {showOrderTypePicker ? (
                  <div className="flex rounded-xl border border-slate-200 bg-white p-1">
                    {deliveryEnabled && (
                      <button
                        type="button"
                        onClick={() => {
                          setOrderType('delivery')
                          persistCheckoutFields('delivery')
                        }}
                        className={`flex-1 rounded-lg py-2.5 text-sm font-medium ${
                          orderType === 'delivery'
                            ? 'bg-violet-600 text-white'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Delivery
                      </button>
                    )}
                    {collectionEnabled && (
                      <button
                        type="button"
                        onClick={() => {
                          setOrderType('collection')
                          persistCheckoutFields('collection')
                        }}
                        className={`flex-1 rounded-lg py-2.5 text-sm font-medium ${
                          orderType === 'collection'
                            ? 'bg-violet-600 text-white'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Collection
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800">
                    {deliveryEnabled && !collectionEnabled ? 'Delivery' : 'Collection'}
                  </p>
                )}
              </div>
            )}

            {deliveryFieldsRequired && (
              <>
                <textarea
                  required
                  placeholder="Delivery address *"
                  value={deliveryAddress}
                  onChange={(e) => {
                    setDeliveryAddress(e.target.value)
                    persistCheckoutFields(orderType, e.target.value, deliveryPostcode)
                  }}
                  className="w-full border rounded-xl px-4 py-3"
                  rows={2}
                />
                <input
                  required
                  placeholder="Postcode *"
                  value={deliveryPostcode}
                  onChange={(e) => {
                    setDeliveryPostcode(e.target.value)
                    setDeliveryValidated(false)
                    persistCheckoutFields(orderType, deliveryAddress, e.target.value)
                  }}
                  onBlur={() => void validateDeliveryPostcode(deliveryPostcode)}
                  className="w-full border rounded-xl px-4 py-3 uppercase"
                />
                {deliveryValidating && (
                  <p className="text-xs text-slate-500">Checking delivery area…</p>
                )}
                {deliveryError && (
                  <p className="text-sm text-red-600">{deliveryError}</p>
                )}
                {deliveryValidated && !deliveryError && (
                  <p className="text-sm text-emerald-700">
                    Delivery available
                    {deliveryFeePence > 0 ? ` · fee ${formatPence(deliveryFeePence)}` : ''}
                    {deliveryMinOrder > 0 ? ` · min ${formatPence(deliveryMinOrder)}` : ''}
                  </p>
                )}
              </>
            )}

            <input required placeholder="Full name *" value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-xl px-4 py-3" />
            <input required type="email" placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded-xl px-4 py-3" />
            <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border rounded-xl px-4 py-3" />
            <textarea placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border rounded-xl px-4 py-3" rows={2} />
          </div>
          {!clientSecret && !orderId && (
            <button
              type="button"
              onClick={createOrder}
              disabled={loading || !canSubmit || belowMin}
              className="w-full mt-6 py-3 bg-violet-600 text-white rounded-xl font-medium disabled:opacity-50"
            >
              {loading ? 'Creating order...' : `Continue to payment ${formatPence(total)}`}
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-slate-900 mb-4">Order summary</h2>
          <p className="mb-4 text-sm text-slate-600 capitalize">
            {orderType === 'delivery' ? 'Delivery' : 'Collection'}
          </p>
          <ul className="space-y-2 text-sm">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>{item.quantity}x {item.name}</span>
                <span>{formatPence(itemLineTotal(item))}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t">
            {belowMin && (
              <p className="mb-3 text-sm text-red-600">
                Minimum order for delivery is {formatPence(deliveryMinOrder)}
              </p>
            )}
            <OrderSummaryBreakdown
              subtotal={subtotal}
              serviceFeePence={serviceFeePence}
              deliveryFeePence={activeDeliveryFee}
              discountPence={discountPence}
              discountLabel={discountLabel}
            />
          </div>

          {clientSecret && orderId && (
            <div className="mt-6">
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm orderId={orderId} slug={slug} total={total} orderMode={orderMode} />
              </Elements>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
