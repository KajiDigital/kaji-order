export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import prisma from '@/app/lib/prisma'
import { formatOrderNumber, formatPence } from '@/app/lib/utils'

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

        <ul className="mt-6 text-left text-sm space-y-1">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between text-slate-700">
              <span>{item.quantity}x {item.name}</span>
              <span>{formatPence(item.price_pence * item.quantity)}</span>
            </li>
          ))}
        </ul>

        <p className="font-bold text-slate-900 mt-4">{formatPence(order.total_pence)}</p>
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
