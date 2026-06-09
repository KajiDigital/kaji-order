'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { getBasket, clearBasket, basketSubtotal, type BasketItem } from '@/app/lib/basket'
import { formatPence } from '@/app/lib/utils'
import { OrderSummaryBreakdown } from '@/app/components/public/OrderSummaryBreakdown'
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
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [orderMode, setOrderMode] = useState('instant')
  const [loading, setLoading] = useState(false)
  const [serviceFeePence, setServiceFeePence] = useState(DEFAULT_SERVICE_FEE_PENCE)
  const [isPreorderMode, setIsPreorderMode] = useState(false)
  const [nextOpenTime, setNextOpenTime] = useState<string | null>(null)

  useEffect(() => {
    const basket = getBasket(slug)
    if (!basket?.items.length) {
      router.push(`/${slug}/basket`)
      return
    }
    setItems(basket.items)
    setNotes(basket.orderNotes ?? '')
    fetch(`/api/menu/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        setServiceFeePence(d.restaurant?.service_fee_pence ?? DEFAULT_SERVICE_FEE_PENCE)
        setIsPreorderMode(Boolean(d.restaurant?.isPreorderMode))
        setNextOpenTime(d.restaurant?.nextOpenTime ?? null)
        if (!d.restaurant?.canOrder) {
          router.push(`/${slug}/basket`)
        }
      })
  }, [slug, router])

  const subtotal = basketSubtotal(items)
  const total = subtotal + serviceFeePence

  async function createOrder() {
    if (!name || !email) return
    setLoading(true)

    const res = await fetch('/api/stripe/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        customer_name: name,
        customer_email: email,
        customer_phone: phone || undefined,
        notes: notes || undefined,
        order_type: 'COLLECTION',
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          name: i.name,
          pricePence: i.pricePence,
          quantity: i.quantity,
          modifiers: i.modifiers.map((m) => ({ name: m.name, priceDeltaPence: m.priceDeltaPence })),
          notes: i.notes,
        })),
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
            <input required placeholder="Full name *" value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-xl px-4 py-3" />
            <input required type="email" placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded-xl px-4 py-3" />
            <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border rounded-xl px-4 py-3" />
            <textarea placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border rounded-xl px-4 py-3" rows={2} />
          </div>
          {!clientSecret && !orderId && (
            <button
              type="button"
              onClick={createOrder}
              disabled={loading || !name || !email}
              className="w-full mt-6 py-3 bg-violet-600 text-white rounded-xl font-medium disabled:opacity-50"
            >
              {loading ? 'Creating order...' : `Continue to payment ${formatPence(total)}`}
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-slate-900 mb-4">Order summary</h2>
          <ul className="space-y-2 text-sm">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>{item.quantity}x {item.name}</span>
                <span>{formatPence(item.pricePence * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t">
            <OrderSummaryBreakdown subtotal={subtotal} serviceFeePence={serviceFeePence} />
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
