export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import prisma from '@/app/lib/prisma'
import { formatOrderNumber, formatPence } from '@/app/lib/utils'
import { OrderSummaryBreakdown } from '@/app/components/public/OrderSummaryBreakdown'

type Params = { params: Promise<{ slug: string; orderId: string }> }

export default async function ConfirmationPage({ params }: Params) {
  const { slug, orderId } = await params

  const order = await prisma.onlineOrder.findFirst({
    where: { id: orderId, restaurant: { slug } },
    include: { items: true, restaurant: true },
  })

  if (!order) notFound()

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border p-8 max-w-md w-full text-center">
        <p className="text-4xl mb-4">🎉</p>
        <h1 className="text-2xl font-bold text-slate-900">Order confirmed!</h1>
        <p className="text-violet-600 font-semibold mt-2">{formatOrderNumber(order.order_number)}</p>
        <p className="text-slate-600 mt-1">{order.restaurant.name}</p>
        {order.is_preorder && (
          <p className="text-amber-700 text-sm mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
            Pre-order confirmed — we&apos;ll prepare your order when we open
            {order.preorder_for
              ? ` (${order.preorder_for.toLocaleString('en-GB', {
                  timeZone: 'Europe/London',
                  weekday: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })})`
              : ''}
            .
          </p>
        )}

        <ul className="mt-6 text-left text-sm space-y-1">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between text-slate-700">
              <span>{item.quantity}x {item.name}</span>
              <span>{formatPence(item.price_pence * item.quantity)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 text-left">
          <OrderSummaryBreakdown
            subtotal={order.subtotal_pence}
            serviceFeePence={order.service_fee_pence}
            deliveryFeePence={order.delivery_fee_pence}
          />
        </div>
        <p className="text-slate-600 text-sm mt-4">
          Ready in ~{order.restaurant.avg_prep_minutes} minutes
        </p>
        <p className="text-slate-500 text-sm mt-2">
          We&apos;ll send updates to {order.customer_email}
        </p>
        <Link href={`/${slug}`} className="inline-block mt-6 text-violet-600 text-sm hover:underline">
          Back to menu
        </Link>
      </div>
    </div>
  )
}
