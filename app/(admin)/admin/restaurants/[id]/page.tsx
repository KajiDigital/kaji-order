export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import prisma from '@/app/lib/prisma'
import { AdminRestaurantDetail } from '@/app/components/admin/AdminRestaurantDetail'

type Params = { params: Promise<{ id: string }> }

export default async function AdminRestaurantPage({ params }: Params) {
  const { id } = await params
  const month = new Date().toISOString().slice(0, 7)

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { created_at: 'desc' },
        take: 50,
      },
      commission_records: {
        where: { period_month: month },
      },
    },
  })

  if (!restaurant) notFound()

  const commissionThisMonth = restaurant.commission_records.reduce(
    (s, r) => s + r.commission_pence,
    0
  )

  return (
    <AdminRestaurantDetail
      restaurant={{
        ...restaurant,
        orders: restaurant.orders.map((o) => ({
          ...o,
          created_at: o.created_at.toISOString(),
        })),
      }}
      commissionThisMonth={commissionThisMonth}
    />
  )
}
