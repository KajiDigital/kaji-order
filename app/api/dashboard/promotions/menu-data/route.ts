import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const categories = await prisma.menuCategory.findMany({
    where: { restaurant_id: session.restaurantId, is_active: true },
    orderBy: { sort_order: 'asc' },
    include: {
      items: {
        where: { is_available: true },
        orderBy: { sort_order: 'asc' },
        select: { id: true, name: true, price_pence: true, category_id: true },
      },
    },
  })

  return NextResponse.json({
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      items: c.items.map((i) => ({
        id: i.id,
        name: i.name,
        price_pence: i.price_pence,
        category_id: i.category_id,
      })),
    })),
  })
}
