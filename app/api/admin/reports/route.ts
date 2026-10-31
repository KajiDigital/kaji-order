import { NextResponse } from 'next/server'
import { getAdminSession } from '@/app/lib/admin-auth'
import prisma from '@/app/lib/prisma'
import { londonDateParts, londonMonthStart, startOfLondonDay } from '@/app/lib/london-time'
import { isLiveOrder } from '@/app/lib/orders'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const RANGES = ['today', '7d', '30d', 'month', 'last_month'] as const

type Range = (typeof RANGES)[number]

function rangeWindow(range: Range) {
  const now = new Date()
  const today = londonDateParts(now)
  const startToday = startOfLondonDay(today.ymd)
  const startThisMonth = londonMonthStart(today)

  if (range === 'today') return { start: startToday, end: now, label: 'Today' }
  if (range === '7d') {
    return {
      start: new Date(startToday.getTime() - 6 * 86_400_000),
      end: now,
      label: 'Last 7 days',
    }
  }
  if (range === '30d') {
    return {
      start: new Date(startToday.getTime() - 29 * 86_400_000),
      end: now,
      label: 'Last 30 days',
    }
  }
  if (range === 'month') {
    return { start: startThisMonth, end: now, label: 'This month' }
  }

  const lastMonthParts = londonDateParts(new Date(startThisMonth.getTime() - 1))
  return {
    start: londonMonthStart(lastMonthParts),
    end: startThisMonth,
    label: 'Last month',
  }
}

export async function GET(request: Request) {
  const admin = await getAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const rangeParam = searchParams.get('range') ?? 'month'
  const range = (RANGES as readonly string[]).includes(rangeParam) ? (rangeParam as Range) : 'month'
  const restaurantId = searchParams.get('restaurant_id') ?? ''
  const { start, end, label } = rangeWindow(range)

  const orders = await prisma.onlineOrder.findMany({
    where: {
      created_at: { gte: start, lt: end },
      ...(restaurantId ? { restaurant_id: restaurantId } : {}),
    },
    select: {
      restaurant_id: true,
      status: true,
      order_type: true,
      total_pence: true,
      subtotal_pence: true,
      commission_pence: true,
      service_fee_pence: true,
      created_at: true,
      restaurant: { select: { id: true, name: true, slug: true } },
    },
  })

  const live = orders.filter((order) => isLiveOrder(order.status))
  const refunded = orders.filter((order) => order.status === 'REFUNDED')

  const sum = (rows: typeof live, key: keyof (typeof live)[number]) =>
    rows.reduce((total, row) => total + (typeof row[key] === 'number' ? (row[key] as number) : 0), 0)

  const sales = sum(live, 'total_pence')
  const food = sum(live, 'subtotal_pence')
  const commission = sum(live, 'commission_pence')
  const serviceFees = sum(live, 'service_fee_pence')
  const collection = live.filter((order) => order.order_type === 'COLLECTION')
  const delivery = live.filter((order) => order.order_type === 'DELIVERY')

  const restaurants = new Map<
    string,
    {
      id: string
      name: string
      slug: string
      orders: number
      sales: number
      food: number
      commission: number
      service_fees: number
      platform: number
    }
  >()
  for (const order of live) {
    const current = restaurants.get(order.restaurant_id) ?? {
      id: order.restaurant.id,
      name: order.restaurant.name,
      slug: order.restaurant.slug,
      orders: 0,
      sales: 0,
      food: 0,
      commission: 0,
      service_fees: 0,
      platform: 0,
    }
    current.orders += 1
    current.sales += order.total_pence
    current.food += order.subtotal_pence
    current.commission += order.commission_pence
    current.service_fees += order.service_fee_pence
    current.platform += order.commission_pence + order.service_fee_pence
    restaurants.set(order.restaurant_id, current)
  }

  const days = new Map<
    string,
    { date: string; orders: number; sales: number; commission: number; service_fees: number; platform: number }
  >()
  for (const order of live) {
    const date = londonDateParts(order.created_at).ymd
    const current = days.get(date) ?? {
      date,
      orders: 0,
      sales: 0,
      commission: 0,
      service_fees: 0,
      platform: 0,
    }
    current.orders += 1
    current.sales += order.total_pence
    current.commission += order.commission_pence
    current.service_fees += order.service_fee_pence
    current.platform += order.commission_pence + order.service_fee_pence
    days.set(date, current)
  }

  return NextResponse.json({
    range,
    label,
    start,
    end,
    summary: {
      orders: live.length,
      sales,
      food,
      aov: live.length ? Math.round(sales / live.length) : 0,
      commission,
      service_fees: serviceFees,
      platform: commission + serviceFees,
      collection_orders: collection.length,
      collection_sales: sum(collection, 'total_pence'),
      delivery_orders: delivery.length,
      delivery_sales: sum(delivery, 'total_pence'),
      refunded_orders: refunded.length,
      refunded_sales: sum(refunded, 'total_pence'),
    },
    restaurants: Array.from(restaurants.values()).sort((a, b) => b.platform - a.platform),
    days: Array.from(days.values()).sort((a, b) => (a.date < b.date ? 1 : -1)),
  })
}
