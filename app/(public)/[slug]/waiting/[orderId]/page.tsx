'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { formatOrderNumber, formatPence, formatReadyAtTime } from '@/app/lib/utils'

type StatusResponse = {
  status: string
  order_number: string
  ready_at: string | null
  estimated_time: string | null
  prep_time_mins: number | null
  accept_by: string | null
  slug: string
}

type OrderDetail = {
  customer_name: string
  total_pence: number
  items: { name: string; quantity: number; price_pence: number }[]
  restaurant: { name: string; logo_url?: string | null }
}

export default function WaitingPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const orderId = params.orderId as string

  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [summaryOpen, setSummaryOpen] = useState(false)

  useEffect(() => {
    async function poll() {
      const res = await fetch(`/api/orders/${orderId}/status`)
      if (!res.ok) return
      const data = await res.json()
      setStatus(data)
      setOrder({
        customer_name: data.customer_name,
        total_pence: data.total_pence,
        items: data.items ?? [],
        restaurant: data.restaurant,
      })

      if (['ACCEPTED', 'PREPARING', 'READY'].includes(data.status)) {
        setTimeout(() => router.push(`/${slug}/confirmation/${orderId}`), 3000)
      }
    }

    poll()
    const id = setInterval(poll, 3000)
    return () => clearInterval(id)
  }, [orderId, slug, router])

  useEffect(() => {
    if (!status?.accept_by) return
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(status.accept_by!).getTime() - Date.now()) / 1000)
      )
      setCountdown(remaining)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [status?.accept_by])

  const mins = Math.floor(countdown / 60)
  const secs = countdown % 60
  const isPending = status?.status === 'PENDING'
  const isAccepted = ['ACCEPTED', 'PREPARING', 'READY'].includes(status?.status ?? '')
  const isFailed = ['REJECTED', 'CANCELLED'].includes(status?.status ?? '')

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border p-8 max-w-md w-full text-center">
        {order?.restaurant.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={order.restaurant.logo_url}
            alt=""
            className="w-16 h-16 rounded-full mx-auto object-cover"
          />
        )}
        <p className="text-slate-600 mt-2">{order?.restaurant.name}</p>

        {isPending && (
          <>
            <div className="my-6 flex justify-center">
              <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Waiting for confirmation...</h1>
            {status && (
              <p className="text-violet-600 font-semibold mt-2">{status.order_number}</p>
            )}
            {countdown > 0 && (
              <p className="text-3xl font-bold text-slate-900 mt-6">
                {mins}:{String(secs).padStart(2, '0')}
              </p>
            )}
            <p className="text-sm text-slate-500 mt-2">
              Restaurant has {mins}:{String(secs).padStart(2, '0')} to confirm
            </p>
          </>
        )}

        {isAccepted && (
          <>
            <p className="text-5xl mt-6">✅</p>
            <h1 className="text-xl font-bold text-slate-900 mt-4">Order confirmed! 🎉</h1>
            {status?.ready_at && (
              <p className="text-lg font-semibold text-violet-600 mt-2">
                Ready at {status.ready_at}
              </p>
            )}
            {status?.estimated_time && (
              <p className="text-slate-600 text-sm mt-1">
                Approximately {status.estimated_time}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-4">Redirecting to confirmation...</p>
          </>
        )}

        {isFailed && (
          <>
            <p className="text-5xl mt-6">😔</p>
            <h1 className="text-xl font-bold text-slate-900 mt-4">Order not accepted</h1>
            <p className="text-slate-600 mt-2">You have not been charged.</p>
            <Link
              href={`/${slug}`}
              className="inline-block mt-6 px-6 py-3 bg-violet-600 text-white rounded-xl font-medium"
            >
              Try again
            </Link>
          </>
        )}

        {order && (
          <div className="mt-6 text-left">
            <button
              type="button"
              onClick={() => setSummaryOpen(!summaryOpen)}
              className="text-sm text-violet-600 w-full text-center"
            >
              {summaryOpen ? 'Hide' : 'Show'} order summary
            </button>
            {summaryOpen && (
              <ul className="mt-3 space-y-1 text-sm border-t pt-3">
                {order.items.map((item, i) => (
                  <li key={i} className="flex justify-between text-slate-700">
                    <span>{item.quantity}x {item.name}</span>
                    <span>{formatPence(item.price_pence * item.quantity)}</span>
                  </li>
                ))}
                <li className="flex justify-between font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>{formatPence(order.total_pence)}</span>
                </li>
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
