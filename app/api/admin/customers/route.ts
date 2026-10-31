import { NextResponse } from 'next/server'
import { getAdminSession } from '@/app/lib/admin-auth'
import { lastLoginPrismaWhere } from '@/app/lib/admin-format'
import prisma from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const admin = await getAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const restaurantId = searchParams.get('restaurant_id') ?? ''
  const q = (searchParams.get('q') ?? '').trim()
  const status = searchParams.get('status') ?? 'active'
  const orders = searchParams.get('orders') ?? 'all'
  const login = searchParams.get('login') ?? 'all'

  const customers = await prisma.customer.findMany({
    where: {
      ...(restaurantId ? { restaurant_id: restaurantId } : {}),
      ...(status === 'active' ? { deleted_at: null } : {}),
      ...(status === 'deleted' ? { deleted_at: { not: null } } : {}),
      ...lastLoginPrismaWhere(login),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: [{ last_login_at: 'desc' }, { created_at: 'desc' }],
    include: {
      restaurant: { select: { id: true, name: true, slug: true } },
      _count: { select: { orders: true } },
      orders: {
        orderBy: { created_at: 'desc' },
        take: 1,
        select: { created_at: true, order_number: true },
      },
    },
  })

  const filtered =
    orders === 'with'
      ? customers.filter((c) => c._count.orders > 0)
      : orders === 'none'
        ? customers.filter((c) => c._count.orders === 0)
        : customers

  return NextResponse.json({
    customers: filtered.map((customer) => ({
      id: customer.id,
      name: customer.deleted_at ? 'Deleted customer' : customer.name,
      email: customer.deleted_at ? '—' : customer.email,
      phone: customer.deleted_at ? null : customer.phone,
      created_at: customer.created_at,
      last_login_at: customer.last_login_at,
      deleted_at: customer.deleted_at,
      order_count: customer._count.orders,
      last_order_number: customer.orders[0]?.order_number ?? null,
      restaurant: customer.restaurant,
    })),
  })
}
