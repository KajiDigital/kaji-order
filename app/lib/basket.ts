export type BasketModifier = {
  groupId: string
  groupName: string
  modifierId: string
  name: string
  priceDeltaPence: number
}

export type BasketItem = {
  id: string
  menuItemId: string
  name: string
  pricePence: number
  quantity: number
  modifiers: BasketModifier[]
  notes?: string
}

export type Basket = {
  items: BasketItem[]
  restaurantSlug: string
  orderNotes?: string
  updatedAt: string
}

export function basketKey(slug: string): string {
  return `kaji-basket-${slug}`
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

export function itemLineTotal(item: BasketItem): number {
  const mods = item.modifiers.reduce((s, m) => s + m.priceDeltaPence, 0)
  return (item.pricePence + mods) * item.quantity
}

export function basketSubtotal(items: BasketItem[]): number {
  return items.reduce((s, item) => s + itemLineTotal(item), 0)
}

export function basketItemCount(items: BasketItem[]): number {
  return items.reduce((s, item) => s + item.quantity, 0)
}
