import type { BasketItemPayload, BasketSelection } from './menu-types'
import { calcLineTotal } from './menu-pricing'

export type { BasketSelection, BasketItemPayload as BasketItem }

export type AppliedDiscount = {
  promotion_id: string
  coupon_code?: string
  discount_pence: number
  description: string
  discount_type?: string
  auto?: boolean
}

export type Basket = {
  items: BasketItemPayload[]
  restaurantSlug: string
  orderNotes?: string
  appliedDiscount?: AppliedDiscount | null
  updatedAt: string
}

const BASKET_VERSION = 'v2'

export function basketKey(slug: string): string {
  return `kaji-basket-${BASKET_VERSION}-${slug}`
}

export function getBasket(slug: string): Basket | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(basketKey(slug))
    if (!raw) return null
    return JSON.parse(raw) as Basket
  } catch {
    return null
  }
}

export function saveBasket(slug: string, basket: Basket): void {
  localStorage.setItem(
    basketKey(slug),
    JSON.stringify({ ...basket, updatedAt: new Date().toISOString() })
  )
}

export function clearBasket(slug: string): void {
  localStorage.removeItem(basketKey(slug))
}

export function itemLineTotal(item: BasketItemPayload): number {
  return item.total_price ?? calcLineTotal(
    item.base_price,
    'OPTIONS',
    item.selections,
    item.quantity
  ).total_price
}

export function basketSubtotal(items: BasketItemPayload[]): number {
  return items.reduce((s, item) => s + itemLineTotal(item), 0)
}

export function basketItemCount(items: BasketItemPayload[]): number {
  return items.reduce((s, item) => s + item.quantity, 0)
}

export function basketItemKey(item: BasketItemPayload): string {
  const selKey = JSON.stringify(item.selections ?? [])
  return `${item.menuItemId}:${selKey}:${item.notes ?? ''}`
}
