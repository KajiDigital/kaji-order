import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const promotions = await prisma.promotion.findMany({
    where: { restaurant_id: session.restaurantId },
    include: {
      coupon_codes: true,
      _count: { select: { order_discounts: true } },
    },
    orderBy: { created_at: 'desc' },
  })

  return NextResponse.json({ promotions })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  if (!body.name || !body.promo_type) {
    return NextResponse.json({ error: 'Name and type required' }, { status: 400 })
  }

  const promotion = await prisma.promotion.create({
    data: {
      restaurant_id: session.restaurantId,
      name: body.name,
      description: body.description ?? null,
      promo_type: body.promo_type,
      discount_pct: body.discount_pct ?? null,
      discount_pence: body.discount_pence ?? null,
      bundle_price: body.bundle_price ?? null,
      buy_quantity: body.buy_quantity ?? null,
      get_quantity: body.get_quantity ?? null,
      applies_to: body.applies_to ?? 'order',
      applicable_ids: body.applicable_ids ?? null,
      promo_config: body.promo_config ?? null,
      min_order_pence: body.min_order_pence ?? null,
      max_uses: body.max_uses ?? null,
      max_uses_per_customer: body.max_uses_per_customer ?? null,
      valid_from: body.valid_from ? new Date(body.valid_from) : null,
      valid_until: body.valid_until ? new Date(body.valid_until) : null,
      days_of_week: body.days_of_week ?? null,
      time_from: body.time_from ?? null,
      time_until: body.time_until ?? null,
      badge_text: body.badge_text ?? null,
      badge_color: body.badge_color ?? '#ef4444',
      show_on_menu: body.show_on_menu !== false,
      active: body.active !== false,
      coupon_codes: body.coupon_codes?.length
        ? {
            create: (body.coupon_codes as string[]).map((code: string) => ({
              restaurant_id: session.restaurantId,
              code: code.toUpperCase().trim(),
              max_uses: body.coupon_max_uses ?? null,
              active: true,
            })),
          }
        : undefined,
    },
    include: { coupon_codes: true },
  })

  return NextResponse.json({ promotion })
}
