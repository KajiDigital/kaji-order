import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'
import { menuItemInclude } from '@/app/lib/menu-api'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const categories = await prisma.menuCategory.findMany({
    where: { restaurant_id: session.restaurantId },
    orderBy: { sort_order: 'asc' },
    include: {
      items: {
        orderBy: { sort_order: 'asc' },
        include: menuItemInclude,
      },
    },
  })

  return NextResponse.json({ categories })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, color, sort_order } = await request.json()
  if (!name) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 })
  }

  const count = await prisma.menuCategory.count({
    where: { restaurant_id: session.restaurantId },
  })

  const category = await prisma.menuCategory.create({
    data: {
      restaurant_id: session.restaurantId,
      name,
      color: color ?? '#64748b',
      sort_order: sort_order ?? count,
    },
  })

  return NextResponse.json({ category })
}
