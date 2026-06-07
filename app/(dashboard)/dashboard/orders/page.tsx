export const dynamic = 'force-dynamic'

import { getSession } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'
import { KanbanBoard } from '@/app/components/kds/KanbanBoard'

export default async function OrdersPage() {
  const session = await getSession()
  if (!session) return null

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.restaurantId },
  })

  const orders = await prisma.onlineOrder.findMany({
    where: {
      restaurant_id: session.restaurantId,
      status: { in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'] },
    },
    include: { items: true },
    orderBy: { created_at: 'asc' },
  })

  const serialized = orders.map((o) => ({
    ...o,
    created_at: o.created_at.toISOString(),
  }))

  return (
    <KanbanBoard
      initialOrders={serialized}
      settings={{
        auto_accept_orders: restaurant?.auto_accept_orders ?? false,
        auto_accept_delay_minutes: restaurant?.auto_accept_delay_minutes ?? 5,
        accept_timeout_minutes: restaurant?.accept_timeout_minutes ?? 10,
        sound_alerts: restaurant?.sound_alerts ?? true,
      }}
    />
  )
}
