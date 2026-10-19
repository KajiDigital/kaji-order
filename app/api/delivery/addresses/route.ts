import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { validateDeliveryForRestaurant } from '@/app/lib/delivery'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** @deprecated Use POST /api/delivery/validate — address lookup is client-side via Google Places */
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
      addresses: [],
      fee_pence: 0,
      minimum_order_pence: 0,
    })
  }

  const validation = await validateDeliveryForRestaurant(restaurant.id, postcode)
  if (!validation.valid) {
    return NextResponse.json({
      valid: false,
      error: validation.error,
      addresses: [],
      fee_pence: 0,
      minimum_order_pence: 0,
    })
  }

  return NextResponse.json({
    valid: true,
    postcode: validation.postcode,
    fee_pence: validation.fee_pence,
    minimum_order_pence: validation.minimum_order_pence,
    addresses: [],
  })
}
