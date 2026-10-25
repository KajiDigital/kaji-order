import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'
import { getOrCreateDefaultDeliveryZone } from '@/app/lib/delivery'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const zone = await prisma.deliveryZone.findFirst({
    where: { restaurant_id: session.restaurantId },
    orderBy: { sort_order: 'asc' },
  })

  const rules = await prisma.postcodeRule.findMany({
    where: { restaurant_id: session.restaurantId, delivery_zone_id: null },
    orderBy: { created_at: 'asc' },
  })

  return NextResponse.json({
    zone: zone
      ? {
          id: zone.id,
          name: zone.name,
          radius_km: zone.radius_km,
          delivery_fee_pence: zone.delivery_fee_pence,
          minimum_order_pence: zone.minimum_order_pence,
          delivery_from: zone.delivery_from,
          delivery_until: zone.delivery_until,
          is_active: zone.is_active,
        }
      : null,
    postcode_rules: rules.map((r) => ({
      id: r.id,
      rule_type: r.rule_type,
      postcode_prefix: r.postcode_prefix,
    })),
  })
}

export async function PATCH(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const {
    radius_km,
    delivery_fee_pence,
    minimum_order_pence,
    delivery_from,
    delivery_until,
    is_active,
  } = body as {
    radius_km?: number
    delivery_fee_pence?: number
    minimum_order_pence?: number
    delivery_from?: string | null
    delivery_until?: string | null
    is_active?: boolean
  }

  const zone = await getOrCreateDefaultDeliveryZone(session.restaurantId)

  const updated = await prisma.deliveryZone.update({
    where: { id: zone.id },
    data: {
      ...(radius_km !== undefined && { radius_km: Math.max(0.5, Number(radius_km) || 5) }),
      ...(delivery_fee_pence !== undefined && {
        delivery_fee_pence: Math.max(0, Math.round(Number(delivery_fee_pence) || 0)),
      }),
      ...(minimum_order_pence !== undefined && {
        minimum_order_pence: Math.max(0, Math.round(Number(minimum_order_pence) || 0)),
      }),
      ...(delivery_from !== undefined && {
        delivery_from: delivery_from?.trim() || null,
      }),
      ...(delivery_until !== undefined && {
        delivery_until: delivery_until?.trim() || null,
      }),
      ...(is_active !== undefined && { is_active: Boolean(is_active) }),
    },
  })

  return NextResponse.json({
    zone: {
      id: updated.id,
      name: updated.name,
      radius_km: updated.radius_km,
      delivery_fee_pence: updated.delivery_fee_pence,
      minimum_order_pence: updated.minimum_order_pence,
      delivery_from: updated.delivery_from,
      delivery_until: updated.delivery_until,
      is_active: updated.is_active,
    },
  })
}
