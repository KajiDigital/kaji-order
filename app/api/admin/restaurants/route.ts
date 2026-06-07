import { NextResponse } from 'next/server'
import { getAdminSession } from '@/app/lib/admin-auth'
import prisma from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const restaurants = await prisma.restaurant.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      orders: {
        where: { created_at: { gte: today } },
        select: {
          id: true,
          total_pence: true,
          commission_pence: true,
        },
      },
    },
  })

  const data = restaurants.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    pricing_plan: r.pricing_plan,
    commission_pct: r.commission_pct,
    ordersToday: r.orders.length,
    revenueToday: r.orders.reduce((s, o) => s + o.total_pence, 0),
    commissionToday: r.orders.reduce((s, o) => s + o.commission_pence, 0),
    created_at: r.created_at,
  }))

  return NextResponse.json({ restaurants: data })
}

export async function POST(request: Request) {
  const admin = await getAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, email, slug, password } = body

  if (!name || !email || !slug || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { hashPassword } = await import('@/app/lib/auth')
  const hashed = await hashPassword(password)

  const restaurant = await prisma.restaurant.create({
    data: {
      name,
      slug,
      email,
      status: 'active',
      contact_name: name,
      staff: {
        create: {
          email,
          password: hashed,
          name,
          role: 'OWNER',
        },
      },
    },
  })

  return NextResponse.json({ restaurant })
}
