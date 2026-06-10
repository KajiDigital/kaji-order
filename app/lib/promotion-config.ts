import type { Promotion } from '@prisma/client'

export type BundleChoiceGroup = {
  id: string
  name: string
  required: boolean
  minSelect: number
  maxSelect: number
  itemIds: string[]
}

export type PromoScope = 'any' | 'category' | 'items' | 'same'

export type PromoConfig = {
  buyFrom?: { scope: PromoScope; ids?: string[] }
  getFrom?: { scope: PromoScope; ids?: string[] }
  freeItemMode?: 'cheapest' | 'specific'
  freeItemId?: string
  freeItemScope?: 'category' | 'item'
  freeItemCategoryId?: string
  freeItemMenuItemId?: string
  freeItemLimit?: 'order' | 'daily'
  bundleGroups?: BundleChoiceGroup[]
}

export function parsePromoConfig(json: unknown): PromoConfig {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return {}
  return json as PromoConfig
}

export function parseDaysList(json: unknown): number[] {
  if (!json || !Array.isArray(json)) return []
  return json.map((d) => Number(d)).filter((d) => !Number.isNaN(d))
}

export function parseIdList(json: unknown): string[] {
  if (!json) return []
  if (Array.isArray(json)) return json.map(String)
  return []
}

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export function formatDaysOfWeek(days: number[]): string {
  if (days.length === 0 || days.length === 7) return 'every day'
  return days.map((d) => DAY_LABELS[d] ?? String(d)).join(', ')
}

export function formatTimeRange(from?: string | null, until?: string | null): string {
  if (!from && !until) return ''
  const fmt = (t: string) => {
    const [h, m] = t.split(':')
    const hour = parseInt(h, 10)
    const suffix = hour >= 12 ? 'pm' : 'am'
    const h12 = hour % 12 || 12
    return m === '00' ? `${h12}${suffix}` : `${h12}:${m}${suffix}`
  }
  if (from && until) return `${fmt(from)}-${fmt(until)}`
  return from ? `from ${fmt(from)}` : `until ${fmt(until!)}`
}

export function poundsToPence(v: string | number): number {
  if (typeof v === 'number') return Math.round(v)
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ''))
  return Number.isNaN(n) ? 0 : Math.round(n * 100)
}

export function penceToPoundsInput(pence: number): string {
  return (pence / 100).toFixed(2)
}

export type MenuCategoryOption = {
  id: string
  name: string
  items: { id: string; name: string; price_pence: number }[]
}

export function buildPromotionPreview(
  promo: Pick<
    Promotion,
    | 'promo_type'
    | 'discount_pct'
    | 'discount_pence'
    | 'bundle_price'
    | 'buy_quantity'
    | 'get_quantity'
    | 'applies_to'
    | 'min_order_pence'
    | 'days_of_week'
    | 'time_from'
    | 'time_until'
    | 'name'
    | 'badge_text'
  > & { promo_config?: unknown; applicable_ids?: unknown },
  menu?: { categories: MenuCategoryOption[] }
): { summary: string; example?: string; savingExample?: string } {
  const config = parsePromoConfig(promo.promo_config)
  const minLabel =
    promo.min_order_pence && promo.min_order_pence > 0
      ? ` — min £${(promo.min_order_pence / 100).toFixed(2)}`
      : ''

  switch (promo.promo_type) {
    case 'PERCENTAGE_OFF': {
      const pct = promo.discount_pct ?? 0
      const scope =
        promo.applies_to === 'order'
          ? 'entire order'
          : promo.applies_to === 'category'
            ? 'selected categories'
            : 'selected items'
      const saving = ((2000 * pct) / 100 / 100).toFixed(2)
      return {
        summary: `${pct}% off ${scope}${minLabel}`,
        example: `${pct}% off ${scope}${minLabel}`,
        savingExample: `Saving on £20 order: £${saving}`,
      }
    }
    case 'FIXED_OFF': {
      const amt = ((promo.discount_pence ?? 0) / 100).toFixed(2)
      return {
        summary: `£${amt} off${minLabel ? ` orders over £${((promo.min_order_pence ?? 0) / 100).toFixed(2)}` : ''}`,
        example: `£${amt} off${minLabel ? ` orders over £${((promo.min_order_pence ?? 0) / 100).toFixed(2)}` : ''}`,
      }
    }
    case 'BUY_X_GET_Y': {
      const buy = promo.buy_quantity ?? 2
      const get = promo.get_quantity ?? 1
      const buyScope = config.buyFrom?.scope ?? 'any'
      let example = `Buy ${buy} get ${get} free`
      if (buyScope === 'category' && config.buyFrom?.ids?.[0] && menu) {
        const cat = menu.categories.find((c) => c.id === config.buyFrom!.ids![0])
        if (cat) example = `Buy any ${buy} ${cat.name.toLowerCase()}, get ${get} free`
      }
      return { summary: example, example }
    }
    case 'BUNDLE': {
      const price = ((promo.bundle_price ?? 0) / 100).toFixed(2)
      return {
        summary: `${promo.badge_text ?? promo.name} — £${price} fixed price`,
        example: `Customer pays £${price} regardless of individual item prices`,
      }
    }
    case 'FREE_ITEM': {
      let itemName = 'free item'
      if (config.freeItemMenuItemId && menu) {
        for (const cat of menu.categories) {
          const item = cat.items.find((i) => i.id === config.freeItemMenuItemId)
          if (item) {
            itemName = item.name
            break
          }
        }
      }
      return {
        summary: `Free ${itemName} with orders over £${((promo.min_order_pence ?? 0) / 100).toFixed(2)}`,
        example: `Free ${itemName.toLowerCase()} with orders over £${((promo.min_order_pence ?? 0) / 100).toFixed(2)}`,
      }
    }
    case 'HAPPY_HOUR': {
      const pct = promo.discount_pct ?? 0
      const days = parseDaysList(promo.days_of_week)
      const dayStr = formatDaysOfWeek(days.length ? days : [1, 2, 3, 4, 5])
      const timeStr = formatTimeRange(promo.time_from, promo.time_until)
      const scope = promo.applies_to === 'category' ? 'selected categories' : 'entire order'
      return {
        summary: `${pct}% off ${scope} ${dayStr} ${timeStr}`.trim(),
        example: `${pct}% off ${scope} ${dayStr} ${timeStr}`.trim(),
      }
    }
    default:
      return { summary: promo.name }
  }
}

export function buildMenuBannerText(
  promotions: Array<
    Pick<
      Promotion,
      | 'promo_type'
      | 'name'
      | 'badge_text'
      | 'min_order_pence'
      | 'buy_quantity'
      | 'get_quantity'
      | 'discount_pct'
    > & {
      promo_config?: unknown
      coupon_codes?: { code: string }[]
    }
  >
): string[] {
  return promotions.map((p) => {
    const codes = p.coupon_codes?.map((c) => c.code)
    if (codes?.length) {
      if (p.promo_type === 'PERCENTAGE_OFF' && p.discount_pct) {
        return `${p.discount_pct}% off with ${codes[0]}`
      }
      return `${p.badge_text ?? p.name} with ${codes[0]}`
    }
    if (p.badge_text) return p.badge_text
    if (p.promo_type === 'BUY_X_GET_Y') {
      return `Buy ${p.buy_quantity ?? 2} get ${p.get_quantity ?? 1} free`
    }
    if (p.promo_type === 'FREE_ITEM' && p.min_order_pence) {
      return `Free item over £${(p.min_order_pence / 100).toFixed(0)}`
    }
    return p.name
  })
}
