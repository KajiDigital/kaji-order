import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'
import type { OrderStatus, OrderType, Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

const ACTIVE_STATUSES: OrderStatus[] = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY']
const REFUNDED_STATUSES: OrderStatus[] = ['REFUNDED', 'CANCELLED', 'REJECTED']

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const view = searchParams.get('view') ?? 'active'

  if (view === 'today') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const orders = await prisma.onlineOrder.findMany({
      where: {
        restaurant_id: session.restaurantId,
        created_at: { gte: today },
      },
      include: { items: true },
      orderBy: { created_at: 'desc' },
    })

    const cancelled = orders.filter((o) =>
      ['CANCELLED', 'REJECTED'].includes(o.status)
    ).length

    return NextResponse.json({
      orders,
      stats: {
        count: orders.length,
        revenue: orders.reduce((s, o) => s + o.total_pence, 0),
        cancelled,
      },
    })
  }

  if (view === 'archive') {
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')
    const search = searchParams.get('search')?.trim()
    const statusFilter = searchParams.get('status')
    const orderTypeFilter = searchParams.get('order_type')

    const to = toParam ? new Date(toParam) : new Date()
    to.setHours(23, 59, 59, 999)
    const from = fromParam
      ? new Date(fromParam)
      : new Date(to.getTime() - 7 * 86_400_000)
    from.setHours(0, 0, 0, 0)

    const where: Prisma.OnlineOrderWhereInput = {
      restaurant_id: session.restaurantId,
      created_at: { gte: from, lte: to },
    }

    if (statusFilter && statusFilter !== 'all') {
      where.status = statusFilter as OrderStatus
    }

    if (orderTypeFilter && orderTypeFilter !== 'all') {
      where.order_type = orderTypeFilter as OrderType
    }

    if (search) {
      const numMatch = search.replace(/\D/g, '')
      where.OR = [
        { customer_name: { contains: search, mode: 'insensitive' } },
        { customer_phone: { contains: search, mode: 'insensitive' } },
        ...(numMatch
          ? [{ order_number: parseInt(numMatch, 10) || undefined }]
          : []),
      ].filter(Boolean) as Prisma.OnlineOrderWhereInput[]
    }

    const orders = await prisma.onlineOrder.findMany({
      where,
      include: { items: true },
      orderBy: { created_at: 'desc' },
      take: 200,
    })

    return NextResponse.json({ orders, from: from.toISOString(), to: to.toISOString() })
  }

  const orders = await prisma.onlineOrder.findMany({
    where:
      view === 'refunded'
        ? {
            restaurant_id: session.restaurantId,
            status: { in: REFUNDED_STATUSES },
          }
        : view === 'all'
          ? { restaurant_id: session.restaurantId }
          : {
              restaurant_id: session.restaurantId,
              status: { in: ACTIVE_STATUSES },
            },
    include: { items: true },
    orderBy: { created_at: 'desc' },
  })

  return NextResponse.json({ orders })
}
