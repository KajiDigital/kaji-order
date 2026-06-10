import prisma from './prisma'
import type { Promotion, CouponCode } from '@prisma/client'
import {
  parseIdList,
  parsePromoConfig,
  formatDaysOfWeek,
  formatTimeRange,
  type PromoConfig,
} from './promotion-config'

export type PromoLineItem = {
  menuItemId: string
  categoryId: string
  quantity: number
  lineTotalPence: number
  unitPricePence?: number
}

export type PromoValidationResult = {
  valid: boolean
  discount_pence: number
  description: string
  promotion_id?: string
  coupon_code?: string
  discount_type?: string
  error?: string
  hints?: string[]
  happy_hour_ends_in_mins?: number
  free_item_qualified?: boolean
  free_item_id?: string
}

type PromotionWithCoupons = Promotion & { coupon_codes: CouponCode[] }

function parseDaysOfWeek(json: unknown): number[] {
  if (!json || !Array.isArray(json)) return []
  return json.map((d) => Number(d)).filter((d) => !Number.isNaN(d))
}

function unitPrice(item: PromoLineItem): number {
  if (item.unitPricePence != null) return item.unitPricePence
  if (item.quantity <= 0) return 0
  return Math.round(item.lineTotalPence / item.quantity)
}

function expandUnitPrices(items: PromoLineItem[]): number[] {
  const prices: number[] = []
  for (const item of items) {
    const unit = unitPrice(item)
    for (let i = 0; i < item.quantity; i++) prices.push(unit)
  }
  return prices
}

function filterItemsByScope(
  items: PromoLineItem[],
  scope: string,
  ids: string[]
): PromoLineItem[] {
  if (scope === 'any' || scope === 'same' || ids.length === 0) return items
  if (scope === 'category') {
    return items.filter((i) => ids.includes(i.categoryId))
  }
  if (scope === 'items') {
    return items.filter((i) => ids.includes(i.menuItemId))
  }
  return items
}

function isWithinTimeRange(
  timeFrom?: string | null,
  timeUntil?: string | null,
  now = new Date()
): boolean {
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

function minutesUntilTimeEnd(timeUntil: string, now = new Date()): number {
  const london = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now)
  const hour = parseInt(london.find((p) => p.type === 'hour')?.value ?? '0', 10)
  const minute = parseInt(london.find((p) => p.type === 'minute')?.value ?? '0', 10)
  const [endH, endM] = timeUntil.split(':').map((v) => parseInt(v, 10))
  const nowMins = hour * 60 + minute
  const endMins = endH * 60 + endM
  return Math.max(0, endMins - nowMins)
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

  if (promo.promo_type === 'HAPPY_HOUR') {
    if (!isWithinTimeRange(promo.time_from, promo.time_until, now)) {
      const days = parseDaysOfWeek(promo.days_of_week)
      const dayStr = formatDaysOfWeek(days.length ? days : [1, 2, 3, 4, 5])
      const timeStr = formatTimeRange(promo.time_from, promo.time_until)
      return {
        ok: false,
        error: `Happy hour is ${timeStr} ${dayStr}`.trim(),
      }
    }
  } else if (!isWithinTimeRange(promo.time_from, promo.time_until, now)) {
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

function calcBuyXGetY(promo: Promotion, items: PromoLineItem[]): number {
  const config = parsePromoConfig(promo.promo_config)
  const buy = promo.buy_quantity ?? 2
  const get = promo.get_quantity ?? 1
  const groupSize = buy + get

  const buyFrom = config.buyFrom ?? { scope: 'any' as const, ids: [] }
  const getFrom = config.getFrom ?? { scope: 'same' as const, ids: [] }

  const buyIds = buyFrom.ids ?? parseIdList(promo.applicable_ids)
  const buyItems = filterItemsByScope(items, buyFrom.scope, buyIds)

  let getItems = buyItems
  if (getFrom.scope === 'same') {
    getItems = buyItems
  } else {
    const getIds = getFrom.ids ?? []
    getItems = filterItemsByScope(items, getFrom.scope, getIds)
  }

  const buyUnits = expandUnitPrices(buyItems)
  if (buyUnits.length < groupSize) return 0

  const numGroups = Math.floor(buyUnits.length / groupSize)
  const freeCount = numGroups * get

  const getUnits = expandUnitPrices(getItems).sort((a, b) => a - b)
  if (getUnits.length === 0) return 0

  let discount = 0
  for (let i = 0; i < Math.min(freeCount, getUnits.length); i++) {
    discount += getUnits[i]
  }

  return discount
}

function calcBundle(promo: Promotion, items: PromoLineItem[]): number {
  const config = parsePromoConfig(promo.promo_config)
  const groups = config.bundleGroups ?? []
  const bundlePrice = promo.bundle_price ?? 0
  if (bundlePrice <= 0 || groups.length === 0) return 0

  let matchedTotal = 0
  const usedItemIds = new Set<string>()

  for (const group of groups) {
    const groupItems = items.filter(
      (i) => group.itemIds.includes(i.menuItemId) && !usedItemIds.has(i.menuItemId)
    )
    const qty = groupItems.reduce((s, i) => s + i.quantity, 0)
    if (group.required && qty < group.minSelect) return 0
    if (qty < group.minSelect) continue

    const selected = groupItems.slice(0, group.maxSelect)
    for (const item of selected) {
      usedItemIds.add(item.menuItemId)
      matchedTotal += item.lineTotalPence
    }
  }

  if (matchedTotal <= 0) return 0
  return Math.max(0, matchedTotal - bundlePrice)
}

function calcFreeItem(
  promo: Promotion,
  items: PromoLineItem[],
  subtotalPence: number
): number {
  const config = parsePromoConfig(promo.promo_config)
  if (promo.min_order_pence != null && subtotalPence < promo.min_order_pence) return 0

  const freeItemId = config.freeItemMenuItemId
  if (!freeItemId) return 0

  const freeLine = items.find((i) => i.menuItemId === freeItemId)
  if (freeLine) return freeLine.lineTotalPence

  return 0
}

export function calculatePromotionDiscount(
  promo: Promotion,
  subtotalPence: number,
  items: PromoLineItem[]
): number {
  switch (promo.promo_type) {
    case 'PERCENTAGE_OFF':
    case 'HAPPY_HOUR': {
      const base = applicableSubtotal(promo, items, subtotalPence)
      if (base <= 0) return 0
      return Math.round(base * ((promo.discount_pct ?? 0) / 100))
    }
    case 'FIXED_OFF': {
      const base = applicableSubtotal(promo, items, subtotalPence)
      if (base <= 0) return 0
      return Math.min(promo.discount_pence ?? 0, subtotalPence)
    }
    case 'BUNDLE':
      return calcBundle(promo, items)
    case 'BUY_X_GET_Y':
      return calcBuyXGetY(promo, items)
    case 'FREE_ITEM':
      return calcFreeItem(promo, items, subtotalPence)
    default:
      return 0
  }
}

function buildDescription(promo: Promotion, code?: string, discountPence?: number): string {
  if (promo.promo_type === 'BUY_X_GET_Y' && discountPence && discountPence > 0) {
    const buy = promo.buy_quantity ?? 2
    const get = promo.get_quantity ?? 1
    return `Buy ${buy} get ${get} free applied — saving £${(discountPence / 100).toFixed(2)}`
  }
  if (code) return `${promo.badge_text ?? promo.name} — ${code}`
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

  if (
    promo.promo_type !== 'FREE_ITEM' &&
    promo.min_order_pence != null &&
    subtotalPence < promo.min_order_pence
  ) {
    return {
      valid: false,
      discount_pence: 0,
      description: '',
      error: `Minimum order is £${(promo.min_order_pence / 100).toFixed(2)}`,
    }
  }

  const discount_pence = calculatePromotionDiscount(promo, subtotalPence, items)

  if (promo.promo_type === 'FREE_ITEM') {
    const config = parsePromoConfig(promo.promo_config)
    const qualified =
      promo.min_order_pence != null && subtotalPence >= promo.min_order_pence
    if (!qualified) {
      return {
        valid: false,
        discount_pence: 0,
        description: '',
        error: `Minimum order is £${((promo.min_order_pence ?? 0) / 100).toFixed(2)}`,
        free_item_qualified: false,
        free_item_id: config.freeItemMenuItemId,
      }
    }
    if (discount_pence <= 0) {
      return {
        valid: false,
        discount_pence: 0,
        description: '',
        error: 'Add your free item to the basket',
        free_item_qualified: true,
        free_item_id: config.freeItemMenuItemId,
      }
    }
  }

  if (discount_pence <= 0) {
    return { valid: false, discount_pence: 0, description: '', error: 'No discount applicable' }
  }

  const result: PromoValidationResult = {
    valid: true,
    discount_pence,
    description: buildDescription(promo, code?.toUpperCase(), discount_pence),
    promotion_id: promo.id,
    coupon_code: code?.toUpperCase().trim(),
    discount_type: promo.promo_type,
  }

  if (promo.promo_type === 'HAPPY_HOUR' && promo.time_until) {
    result.happy_hour_ends_in_mins = minutesUntilTimeEnd(promo.time_until)
  }

  return result
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

export async function getPromotionHints(input: {
  restaurantId: string
  subtotalPence: number
  items: PromoLineItem[]
}): Promise<string[]> {
  const promotions = await prisma.promotion.findMany({
    where: { restaurant_id: input.restaurantId, active: true, show_on_menu: true },
    include: { coupon_codes: { where: { active: true } } },
  })

  const hints: string[] = []

  for (const promo of promotions) {
    if (!isPromotionActiveNow(promo).ok) continue

    if (promo.promo_type === 'FREE_ITEM' && promo.min_order_pence) {
      if (input.subtotalPence < promo.min_order_pence) {
        const needed = promo.min_order_pence - input.subtotalPence
        hints.push(`Add £${(needed / 100).toFixed(2)} more for free item`)
      } else {
        const config = parsePromoConfig(promo.promo_config)
        if (config.freeItemMenuItemId) {
          const hasFree = input.items.some((i) => i.menuItemId === config.freeItemMenuItemId)
          if (!hasFree) hints.push('🎉 You qualify for a free item — add it to your basket')
        }
      }
    }

    if (promo.coupon_codes.length > 0) {
      for (const c of promo.coupon_codes) {
        hints.push(`Enter ${c.code} for ${promo.badge_text ?? promo.name}`)
      }
    }

    if (promo.promo_type === 'BUY_X_GET_Y') {
      const buy = promo.buy_quantity ?? 2
      const get = promo.get_quantity ?? 1
      const config = parsePromoConfig(promo.promo_config)
      const buyFrom = config.buyFrom ?? { scope: 'any' as const }
      const buyIds = buyFrom.ids ?? parseIdList(promo.applicable_ids)
      const buyItems = filterItemsByScope(input.items, buyFrom.scope, buyIds)
      const totalQty = buyItems.reduce((s, i) => s + i.quantity, 0)
      const needed = buy + get - totalQty
      if (needed > 0 && needed < buy + get) {
        hints.push(`Add ${needed} more item${needed > 1 ? 's' : ''} for Buy ${buy} Get ${get} free`)
      }
    }

    if (promo.promo_type === 'HAPPY_HOUR' && isPromotionActiveNow(promo).ok && promo.time_until) {
      const mins = minutesUntilTimeEnd(promo.time_until)
      if (mins > 0 && mins <= 120) {
        hints.push(`Happy hour ends in ${mins} min — ${promo.discount_pct}% off now`)
      }
    }
  }

  return [...new Set(hints)]
}

export async function getMenuPromotions(restaurantId: string) {
  const promotions = await prisma.promotion.findMany({
    where: {
      restaurant_id: restaurantId,
      active: true,
      show_on_menu: true,
    },
    include: {
      coupon_codes: { where: { active: true }, select: { id: true, code: true } },
    },
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

export type { PromoConfig }
