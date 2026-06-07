import { NextResponse } from 'next/server'
import { getAdminSession } from '@/app/lib/admin-auth'
import prisma from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const admin = await getAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const month = new Date().toISOString().slice(0, 7)

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { created_at: 'desc' },
        take: 50,
        include: { items: true },
      },
      commission_records: {
        where: { period_month: month },
      },
    },
  })

  if (!restaurant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const commissionThisMonth = restaurant.commission_records.reduce(
    (s, r) => s + r.commission_pence,
    0
  )

  return NextResponse.json({
    restaurant,
    commissionThisMonth,
  })
}

export async function PATCH(request: Request, { params }: Params) {
  const admin = await getAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { commission_pct } = await request.json()

  const restaurant = await prisma.restaurant.update({
    where: { id },
    data: { commission_pct },
  })

  return NextResponse.json({ restaurant })
}
