import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { customerOrdersWhere, getCustomerSession } from '@/app/lib/customer-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get('slug')
  const session = await getCustomerSession()
  if (!session || (slug && session.slug !== slug)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orders = await prisma.onlineOrder.findMany({
    where: customerOrdersWhere(session.restaurantId, session.customerId, session.email),
    orderBy: { created_at: 'desc' },
    take: 50,
    include: {
      items: { select: { id: true, name: true, quantity: true, total_price: true } },
    },
  })

  return NextResponse.json({
    orders: orders.map((order) => ({
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      order_type: order.order_type,
      total_pence: order.total_pence,
      created_at: order.created_at,
      items: order.items,
    })),
  })
}
