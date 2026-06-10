import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import {
  findBestAutoPromotion,
  getPromotionHints,
  validatePromotion,
  type PromoLineItem,
} from '@/app/lib/promotions'

export const dynamic = 'force-dynamic'

type ValidateItem = {
  menuItemId: string
  categoryId: string
  quantity: number
  lineTotalPence: number
  unitPricePence?: number
}

export async function POST(request: Request) {
  const body = await request.json()
  const slug = body.slug as string | undefined
  const restaurantId = body.restaurant_id as string | undefined
  const code = body.code as string | undefined
  const autoApply = body.auto_apply === true
  const includeHints = body.hints === true
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
    unitPricePence: i.unitPricePence,
  }))

  const hints = includeHints
    ? await getPromotionHints({
        restaurantId: resolvedRestaurantId,
        subtotalPence,
        items: promoItems,
      })
    : undefined

  if (includeHints && !code && !autoApply && !body.check_free_item) {
    return NextResponse.json({ hints: hints ?? [] })
  }

  if (body.check_free_item === true) {
    const freePromos = await prisma.promotion.findMany({
      where: {
        restaurant_id: resolvedRestaurantId,
        active: true,
        promo_type: 'FREE_ITEM',
      },
    })
    for (const promo of freePromos) {
      const result = await validatePromotion({
        restaurantId: resolvedRestaurantId,
        subtotalPence,
        items: promoItems,
        promotionId: promo.id,
      })
      if (result.free_item_qualified && result.free_item_id) {
        return NextResponse.json({
          qualified: true,
          free_item_id: result.free_item_id,
          promotion_id: promo.id,
          hints,
        })
      }
    }
    return NextResponse.json({ qualified: false, hints })
  }

  if (code) {
    const result = await validatePromotion({
      restaurantId: resolvedRestaurantId,
      subtotalPence,
      items: promoItems,
      code,
    })
    return NextResponse.json({ ...result, hints })
  }

  if (autoApply) {
    const best = await findBestAutoPromotion({
      restaurantId: resolvedRestaurantId,
      subtotalPence,
      items: promoItems,
    })
    if (best) {
      return NextResponse.json({ ...best, hints })
    }
    return NextResponse.json({
      valid: false,
      discount_pence: 0,
      description: '',
      hints,
    })
  }

  return NextResponse.json(
    { valid: false, discount_pence: 0, description: '', error: 'Code or auto_apply required', hints },
    { status: 400 }
  )
}
