import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import {
  findBestAutoPromotion,
  validatePromotion,
  type PromoLineItem,
} from '@/app/lib/promotions'

export const dynamic = 'force-dynamic'

type ValidateItem = {
  menuItemId: string
  categoryId: string
  quantity: number
  lineTotalPence: number
}

export async function POST(request: Request) {
  const body = await request.json()
  const slug = body.slug as string | undefined
  const restaurantId = body.restaurant_id as string | undefined
  const code = body.code as string | undefined
  const autoApply = body.auto_apply === true
  const items = (body.items ?? []) as ValidateItem[]
  const subtotalPence = Number(body.subtotal) || 0

  let resolvedRestaurantId = restaurantId

  if (!resolvedRestaurantId && slug) {
    const restaurant = await prisma.restaurant.findFirst({
      where: { slug, deleted_at: null },
      select: { id: true },
    })
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }
    resolvedRestaurantId = restaurant.id
  }

  if (!resolvedRestaurantId) {
    return NextResponse.json({ error: 'Restaurant required' }, { status: 400 })
  }

  const promoItems: PromoLineItem[] = items.map((i) => ({
    menuItemId: i.menuItemId,
    categoryId: i.categoryId,
    quantity: i.quantity,
    lineTotalPence: i.lineTotalPence,
  }))

  if (code) {
    const result = await validatePromotion({
      restaurantId: resolvedRestaurantId,
      subtotalPence,
      items: promoItems,
      code,
    })
    return NextResponse.json(result)
  }

  if (autoApply) {
    const best = await findBestAutoPromotion({
      restaurantId: resolvedRestaurantId,
      subtotalPence,
      items: promoItems,
    })
    if (best) {
      return NextResponse.json(best)
    }
    return NextResponse.json({
      valid: false,
      discount_pence: 0,
      description: '',
    })
  }

  return NextResponse.json(
    { valid: false, discount_pence: 0, description: '', error: 'Code or auto_apply required' },
    { status: 400 }
  )
}
