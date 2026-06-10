import prisma from './prisma'
import type { Promotion, CouponCode } from '@prisma/client'

export type PromoLineItem = {
  menuItemId: string
  categoryId: string
  quantity: number
  lineTotalPence: number
}

export type PromoValidationResult = {
  valid: boolean
  discount_pence: number
  description: string
  promotion_id?: string
  coupon_code?: string
  discount_type?: string
  error?: string
}

type PromotionWithCoupons = Promotion & { coupon_codes: CouponCode[] }

function parseIdList(json: unknown): string[] {
  if (!json) return []
  if (Array.isArray(json)) return json.map(String)
  return []
}

function parseDaysOfWeek(json: unknown): number[] {
  if (!json || !Array.isArray(json)) return []
  return json.map((d) => Number(d)).filter((d) => !Number.isNaN(d))
}

function isWithinTimeRange(timeFrom?: string | null, timeUntil?: string | null, now = new Date()): boolean {
  if (!timeFrom && !timeUntil) return true
  const london = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now)
  const hour = london.find((p) => p.type === 'hour')?.value ?? '00'
  const minute = london.find((p) => p.type === 'minute')?.value ?? '00'
  const current = `${hour}:${minute}`

  if (timeFrom && current < timeFrom) return false
  if (timeUntil && current > timeUntil) return false
  return true
}

export function isPromotionActiveNow(
  promo: Promotion,
  now = new Date()
): { ok: boolean; error?: string } {
  if (!promo.active) return { ok: false, error: 'Promotion is not active' }

  if (promo.valid_from && now < promo.valid_from) {
    return { ok: false, error: 'Promotion is not valid yet' }
  }
  if (promo.valid_until && now > promo.valid_until) {
    return { ok: false, error: 'Promotion has expired' }
  }

  const days = parseDaysOfWeek(promo.days_of_week)
  if (days.length > 0) {
    const day = now.getDay()
    if (!days.includes(day)) {
      return { ok: false, error: 'Promotion not valid today' }
    }
  }

  if (!isWithinTimeRange(promo.time_from, promo.time_until, now)) {
    return { ok: false, error: 'Promotion not valid at this time' }
  }

  if (promo.max_uses != null && promo.uses_count >= promo.max_uses) {
    return { ok: false, error: 'Promotion usage limit reached' }
  }

  return { ok: true }
}

function applicableSubtotal(
  promo: Promotion,
  items: PromoLineItem[],
  subtotalPence: number
): number {
  if (promo.applies_to === 'order') return subtotalPence

  const ids = parseIdList(promo.applicable_ids)
  if (ids.length === 0) return subtotalPence

  if (promo.applies_to === 'category') {
    return items
      .filter((i) => ids.includes(i.categoryId))
      .reduce((s, i) => s + i.lineTotalPence, 0)
  }

  if (promo.applies_to === 'items') {
    return items
      .filter((i) => ids.includes(i.menuItemId))
      .reduce((s, i) => s + i.lineTotalPence, 0)
  }

  return subtotalPence
}

export function calculatePromotionDiscount(
  promo: Promotion,
  subtotalPence: number,
  items: PromoLineItem[]
): number {
  const base = applicableSubtotal(promo, items, subtotalPence)
  if (base <= 0) return 0

  switch (promo.promo_type) {
    case 'PERCENTAGE_OFF':
    case 'HAPPY_HOUR':
      return Math.round(base * ((promo.discount_pct ?? 0) / 100))
    case 'FIXED_OFF':
      return Math.min(promo.discount_pence ?? 0, subtotalPence)
    case 'BUNDLE':
      if (promo.bundle_price != null && subtotalPence > promo.bundle_price) {
        return subtotalPence - promo.bundle_price
      }
      return 0
    case 'BUY_X_GET_Y': {
      const buy = promo.buy_quantity ?? 2
      const get = promo.get_quantity ?? 1
      const eligible = items.filter((i) => {
        const ids = parseIdList(promo.applicable_ids)
        return ids.length === 0 || ids.includes(i.menuItemId)
      })
      let discount = 0
      for (const item of eligible) {
        const unit = Math.floor(item.lineTotalPence / item.quantity)
        const sets = Math.floor(item.quantity / (buy + get))
        discount += sets * get * unit
      }
      return discount
    }
    case 'FREE_ITEM':
      return 0
    default:
      return 0
  }
}

function buildDescription(promo: Promotion, code?: string): string {
  if (code) return `${promo.name} — ${code}`
  return promo.badge_text ?? promo.name
}

export async function validatePromotion(input: {
  restaurantId: string
  subtotalPence: number
  items: PromoLineItem[]
  code?: string
  promotionId?: string
}): Promise<PromoValidationResult> {
  const { restaurantId, subtotalPence, items, code, promotionId } = input

  let promo: PromotionWithCoupons | null = null

  if (code) {
    const foundCoupon = await prisma.couponCode.findFirst({
      where: {
        restaurant_id: restaurantId,
        code: code.toUpperCase().trim(),
        active: true,
      },
      include: { promotion: { include: { coupon_codes: true } } },
    })

    if (!foundCoupon) {
      return { valid: false, discount_pence: 0, description: '', error: 'Invalid coupon code' }
    }

    if (foundCoupon.max_uses != null && foundCoupon.uses_count >= foundCoupon.max_uses) {
      return { valid: false, discount_pence: 0, description: '', error: 'Coupon usage limit reached' }
    }

    const now = new Date()
    if (foundCoupon.valid_from && now < foundCoupon.valid_from) {
      return { valid: false, discount_pence: 0, description: '', error: 'Coupon not valid yet' }
    }
    if (foundCoupon.valid_until && now > foundCoupon.valid_until) {
      return { valid: false, discount_pence: 0, description: '', error: 'Coupon has expired' }
    }

    promo = foundCoupon.promotion
  } else if (promotionId) {
    promo = await prisma.promotion.findFirst({
      where: { id: promotionId, restaurant_id: restaurantId },
      include: { coupon_codes: { where: { active: true } } },
    })
  }

  if (!promo) {
    return { valid: false, discount_pence: 0, description: '', error: 'Promotion not found' }
  }

  if (!code && promo.coupon_codes.length > 0) {
    return {
      valid: false,
      discount_pence: 0,
      description: '',
      error: 'Coupon code required for this promotion',
    }
  }

  const activeCheck = isPromotionActiveNow(promo)
  if (!activeCheck.ok) {
    return { valid: false, discount_pence: 0, description: '', error: activeCheck.error }
  }

  if (promo.min_order_pence != null && subtotalPence < promo.min_order_pence) {
    return {
      valid: false,
      discount_pence: 0,
      description: '',
      error: `Minimum order is £${(promo.min_order_pence / 100).toFixed(2)}`,
    }
  }

  const discount_pence = calculatePromotionDiscount(promo, subtotalPence, items)
  if (discount_pence <= 0) {
    return { valid: false, discount_pence: 0, description: '', error: 'No discount applicable' }
  }

  return {
    valid: true,
    discount_pence,
    description: buildDescription(promo, code?.toUpperCase()),
    promotion_id: promo.id,
    coupon_code: code?.toUpperCase().trim(),
    discount_type: promo.promo_type,
  }
}

export async function findBestAutoPromotion(input: {
  restaurantId: string
  subtotalPence: number
  items: PromoLineItem[]
}): Promise<PromoValidationResult | null> {
  const promotions = await prisma.promotion.findMany({
    where: {
      restaurant_id: input.restaurantId,
      active: true,
      applies_to: 'order',
    },
    include: { coupon_codes: { where: { active: true } } },
  })

  let best: PromoValidationResult | null = null

  for (const promo of promotions) {
    if (promo.coupon_codes.length > 0) continue

    const result = await validatePromotion({
      restaurantId: input.restaurantId,
      subtotalPence: input.subtotalPence,
      items: input.items,
      promotionId: promo.id,
    })

    if (result.valid && (!best || result.discount_pence > best.discount_pence)) {
      best = result
    }
  }

  return best
}

export async function getMenuPromotions(restaurantId: string) {
  const promotions = await prisma.promotion.findMany({
    where: {
      restaurant_id: restaurantId,
      active: true,
      show_on_menu: true,
    },
    include: { coupon_codes: { where: { active: true }, select: { id: true } } },
    orderBy: { created_at: 'desc' },
  })

  return promotions.filter((p) => isPromotionActiveNow(p).ok)
}

export async function incrementPromotionUsage(
  promotionId: string,
  couponCode?: string | null
) {
  await prisma.promotion.update({
    where: { id: promotionId },
    data: { uses_count: { increment: 1 } },
  })

  if (couponCode) {
    await prisma.couponCode.updateMany({
      where: { promotion_id: promotionId, code: couponCode },
      data: { uses_count: { increment: 1 } },
    })
  }
}

export function generateCouponCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
