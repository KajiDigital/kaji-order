export const dynamic = 'force-dynamic'

import prisma from '@/app/lib/prisma'
import { latestIsoTimestamp } from '@/app/lib/admin-format'
import { startOfLondonDay } from '@/app/lib/london-time'
import { AdminRestaurantsClient } from '@/app/components/admin/AdminRestaurantsClient'

export default async function AdminRestaurantsPage() {
  const restaurants = await prisma.restaurant.findMany({
    where: { deleted_at: null },
    include: {
      orders: {
        where: { created_at: { gte: startOfLondonDay() } },
        select: { commission_pence: true },
      },
      staff: { select: { last_login_at: true } },
    },
    orderBy: { created_at: 'desc' },
  })

  return (
    <AdminRestaurantsClient
      restaurants={restaurants.map((restaurant) => ({
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        email: restaurant.email,
        phone: restaurant.phone,
        contact_name: restaurant.contact_name,
        restaurant_type: restaurant.restaurant_type,
        status: restaurant.status,
        pricing_plan: restaurant.pricing_plan,
        created_at: restaurant.created_at.toISOString(),
        last_login_at: latestIsoTimestamp(restaurant.staff.map((staff) => staff.last_login_at)),
        ordersToday: restaurant.orders.length,
        commissionToday: restaurant.orders.reduce((sum, order) => sum + order.commission_pence, 0),
      }))}
    />
  )
}
