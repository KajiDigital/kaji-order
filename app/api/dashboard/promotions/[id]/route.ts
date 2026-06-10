import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  const existing = await prisma.promotion.findFirst({
    where: { id, restaurant_id: session.restaurantId },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const promotion = await prisma.promotion.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.promo_type !== undefined && { promo_type: body.promo_type }),
      ...(body.discount_pct !== undefined && { discount_pct: body.discount_pct }),
      ...(body.discount_pence !== undefined && { discount_pence: body.discount_pence }),
      ...(body.bundle_price !== undefined && { bundle_price: body.bundle_price }),
      ...(body.buy_quantity !== undefined && { buy_quantity: body.buy_quantity }),
      ...(body.get_quantity !== undefined && { get_quantity: body.get_quantity }),
      ...(body.applies_to !== undefined && { applies_to: body.applies_to }),
      ...(body.applicable_ids !== undefined && { applicable_ids: body.applicable_ids }),
      ...(body.min_order_pence !== undefined && { min_order_pence: body.min_order_pence }),
      ...(body.max_uses !== undefined && { max_uses: body.max_uses }),
      ...(body.valid_from !== undefined && {
        valid_from: body.valid_from ? new Date(body.valid_from) : null,
      }),
      ...(body.valid_until !== undefined && {
        valid_until: body.valid_until ? new Date(body.valid_until) : null,
      }),
      ...(body.days_of_week !== undefined && { days_of_week: body.days_of_week }),
      ...(body.time_from !== undefined && { time_from: body.time_from }),
      ...(body.time_until !== undefined && { time_until: body.time_until }),
      ...(body.badge_text !== undefined && { badge_text: body.badge_text }),
      ...(body.badge_color !== undefined && { badge_color: body.badge_color }),
      ...(body.show_on_menu !== undefined && { show_on_menu: body.show_on_menu }),
      ...(body.active !== undefined && { active: body.active }),
    },
    include: { coupon_codes: true },
  })

  return NextResponse.json({ promotion })
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.promotion.findFirst({
    where: { id, restaurant_id: session.restaurantId },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.promotion.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
