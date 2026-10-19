import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { validateDeliveryForRestaurant } from '@/app/lib/delivery'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const body = await request.json()
  const { slug, postcode } = body as { slug?: string; postcode?: string }

  if (!slug || !postcode?.trim()) {
    return NextResponse.json({ error: 'Missing slug or postcode' }, { status: 400 })
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: { slug, deleted_at: null, status: 'active' },
    select: { id: true, delivery_enabled: true },
  })

  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
  }

  if (!restaurant.delivery_enabled) {
    return NextResponse.json({
      valid: false,
      error: 'Delivery is not available',
      fee_pence: 0,
      minimum_order_pence: 0,
    })
  }

  const result = await validateDeliveryForRestaurant(restaurant.id, postcode)
  return NextResponse.json(result)
}
