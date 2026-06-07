export const dynamic = 'force-dynamic'

import Link from 'next/link'
import prisma from '@/app/lib/prisma'
import { formatPence } from '@/app/lib/utils'

export default async function AdminRestaurantsPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const restaurants = await prisma.restaurant.findMany({
    include: {
      orders: { where: { created_at: { gte: today } } },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">All Restaurants</h1>
      <div className="space-y-2">
        {restaurants.map((r) => (
          <Link
            key={r.id}
            href={`/admin/restaurants/${r.id}`}
            className="block bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-violet-500"
          >
            <p className="font-medium text-white">{r.name}</p>
            <p className="text-sm text-slate-500">
              {r.email} · {r.pricing_plan} · {r.orders.length} orders today ·{' '}
              {formatPence(r.orders.reduce((s, o) => s + o.commission_pence, 0))}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
