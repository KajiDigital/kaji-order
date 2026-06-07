export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import prisma from '@/app/lib/prisma'
import { AdminRestaurantDetail } from '@/app/components/admin/AdminRestaurantDetail'

type Params = { params: Promise<{ id: string }> }

export default async function AdminRestaurantPage({ params }: Params) {
  const { id } = await params
  const month = new Date().toISOString().slice(0, 7)

  const restaurant = await prisma.restaurant.findFirst({
    where: { id, deleted_at: null },
    include: {
      staff: { select: { last_login_at: true }, take: 1, orderBy: { created_at: 'asc' } },
      orders: { orderBy: { created_at: 'desc' }, take: 50 },
      commission_records: true,
      _count: { select: { orders: true } },
    },
  })

  if (!restaurant) notFound()

  const ordersThisMonth = await prisma.onlineOrder.count({
    where: {
      restaurant_id: id,
      created_at: { gte: new Date(`${month}-01`) },
    },
  })

  const totalCommissionOwed = restaurant.commission_records
    .filter((r) => r.status === 'PENDING')
    .reduce((s, r) => s + r.commission_pence, 0)

  const commissionThisMonth = restaurant.commission_records
    .filter((r) => r.period_month === month)
    .reduce((s, r) => s + r.commission_pence, 0)

  return (
    <AdminRestaurantDetail
      restaurant={{
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        status: restaurant.status,
        contact_name: restaurant.contact_name,
        email: restaurant.email,
        phone: restaurant.phone,
        restaurant_type: restaurant.restaurant_type,
        pricing_plan: restaurant.pricing_plan,
        commission_pct: restaurant.commission_pct,
        admin_notes: restaurant.admin_notes,
        created_at: restaurant.created_at.toISOString(),
        orders: restaurant.orders.map((o) => ({
          id: o.id,
          order_number: o.order_number,
          customer_name: o.customer_name,
          total_pence: o.total_pence,
          status: o.status,
          created_at: o.created_at.toISOString(),
        })),
      }}
      stats={{
        totalOrders: restaurant._count.orders,
        ordersThisMonth,
        totalCommissionOwed,
        commissionThisMonth,
        lastLogin: restaurant.staff[0]?.last_login_at?.toISOString() ?? null,
      }}
    />
  )
}
