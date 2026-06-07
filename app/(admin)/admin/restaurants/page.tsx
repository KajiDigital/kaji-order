export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import prisma from '@/app/lib/prisma'
import { AdminRestaurantsClient } from '@/app/components/admin/AdminRestaurantsClient'

export default async function AdminRestaurantsPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const restaurants = await prisma.restaurant.findMany({
    where: { deleted_at: null },
    include: {
      orders: {
        where: { created_at: { gte: today } },
        select: { commission_pence: true },
      },
    },
    orderBy: { created_at: 'desc' },
  })

  const data = restaurants.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    email: r.email,
    phone: r.phone,
    contact_name: r.contact_name,
    restaurant_type: r.restaurant_type,
    description: r.description,
    status: r.status,
    pricing_plan: r.pricing_plan,
    ordersToday: r.orders.length,
    commissionToday: r.orders.reduce((s, o) => s + o.commission_pence, 0),
  }))

  return (
    <Suspense fallback={<p className="text-slate-400">Loading...</p>}>
      <AdminRestaurantsClient restaurants={data} />
    </Suspense>
  )
}
