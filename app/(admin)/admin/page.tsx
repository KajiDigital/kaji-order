export const dynamic = 'force-dynamic'

import Link from 'next/link'
import prisma from '@/app/lib/prisma'
import { formatPence } from '@/app/lib/utils'

export default async function AdminPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const restaurants = await prisma.restaurant.findMany({
    where: { deleted_at: null },
    include: {
      orders: {
        where: { created_at: { gte: today } },
      },
    },
    orderBy: { created_at: 'desc' },
  })

  const totalOrdersToday = restaurants.reduce((s, r) => s + r.orders.length, 0)
  const totalFoodCommissionToday = restaurants.reduce(
    (s, r) => s + r.orders.reduce((os, o) => os + o.commission_pence, 0),
    0
  )
  const totalServiceFeesToday = restaurants.reduce(
    (s, r) => s + r.orders.reduce((os, o) => os + o.service_fee_pence, 0),
    0
  )
  const totalPlatformToday = totalFoodCommissionToday + totalServiceFeesToday
  const activeToday = restaurants.filter((r) => r.orders.length > 0).length

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Stat label="Restaurants" value={String(restaurants.length)} />
        <Stat label="Active today" value={String(activeToday)} />
        <Stat label="Orders today" value={String(totalOrdersToday)} />
        <Stat label="Commission today" value={formatPence(totalFoodCommissionToday)} />
        <Stat label="Service fees today" value={formatPence(totalServiceFeesToday)} />
      </div>
      <p className="text-sm text-slate-400">
        Total platform revenue today:{' '}
        <span className="text-violet-400 font-medium">{formatPence(totalPlatformToday)}</span>
        {' '}(commission + service fees)
      </p>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-white">Restaurants</h2>
          <Link href="/admin/restaurants" className="text-sm text-violet-400">View all</Link>
        </div>
        <div className="space-y-2">
          {restaurants.map((r) => {
            const ordersToday = r.orders.length
            const commissionToday = r.orders.reduce((s, o) => s + o.commission_pence, 0)
            const serviceFeesToday = r.orders.reduce((s, o) => s + o.service_fee_pence, 0)
            const platformToday = commissionToday + serviceFeesToday
            return (
              <Link
                key={r.id}
                href={`/admin/restaurants/${r.id}`}
                className="block bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-violet-500"
              >
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium text-white">{r.name}</p>
                    <p className="text-sm text-slate-500">/{r.slug} · {r.pricing_plan}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-slate-300">{ordersToday} orders today</p>
                    <p className="text-violet-400">{formatPence(platformToday)} platform</p>
                    <p className="text-xs text-slate-500">
                      {formatPence(commissionToday)} commission + {formatPence(serviceFeesToday)} fees
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  )
}
