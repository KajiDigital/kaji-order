import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orders = await prisma.onlineOrder.findMany({
    where: {
      restaurant_id: session.restaurantId,
      status: { in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'] },
    },
    include: { items: true },
    orderBy: { created_at: 'asc' },
  })

  return NextResponse.json({ orders })
}
