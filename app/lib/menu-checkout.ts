import type { BasketSelection, MenuProduct, PricingType } from './menu-types'
import { calcLineTotal } from './menu-pricing'
import { isValidSelections, normalizeLegacyModifiers } from './menu-selections'
import { serializeMenuItem, menuItemInclude } from './menu-api'
import prisma from './prisma'

export type ValidatedCheckoutItem = {
  menuItemId: string
  name: string
  base_price: number
  quantity: number
  selections: BasketSelection[]
  options_price: number
  total_price: number
  notes?: string
  categoryId: string
}

export async function validateCheckoutItems(
  restaurantId: string,
  items: {
    menuItemId: string
    name?: string
    base_price?: number
    pricePence?: number
    quantity: number
    selections?: BasketSelection[]
    modifiers?: { groupName?: string; name: string; priceDeltaPence?: number; groupId?: string; modifierId?: string }[]
    notes?: string
  }[]
): Promise<{ ok: true; items: ValidatedCheckoutItem[]; subtotal: number } | { ok: false; error: string }> {
  const menuItemIds = items.map((i) => i.menuItemId)
  const dbItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds }, restaurant_id: restaurantId },
    include: menuItemInclude,
  })

  if (dbItems.length !== new Set(menuItemIds).size) {
    return { ok: false, error: 'Invalid menu items in basket' }
  }

  const productMap = new Map(dbItems.map((i) => [i.id, serializeMenuItem(i)]))
  const validated: ValidatedCheckoutItem[] = []

  for (const item of items) {
    const product = productMap.get(item.menuItemId)
    if (!product || !product.available) {
      return { ok: false, error: `Item unavailable: ${item.name ?? item.menuItemId}` }
    }

    const selections: BasketSelection[] =
      item.selections ??
      (item.modifiers ? normalizeLegacyModifiers(item.modifiers) : [])

    if (!isValidSelections(product, selections)) {
      return { ok: false, error: `Invalid selections for ${product.name}` }
    }

    const pricingType = (product.pricing_type ?? (product.is_bundle ? 'BUNDLE' : 'OPTIONS')) as PricingType
    const { options_price, total_price } = calcLineTotal(
      product.base_price,
      pricingType,
      selections,
      item.quantity
    )

    const dbItem = dbItems.find((d) => d.id === item.menuItemId)!
    validated.push({
      menuItemId: item.menuItemId,
      name: product.name,
      base_price: product.base_price,
      quantity: item.quantity,
      selections,
      options_price,
      total_price,
      notes: item.notes,
      categoryId: dbItem.category_id,
    })
  }

  const subtotal = validated.reduce((s, i) => s + i.total_price, 0)
  return { ok: true, items: validated, subtotal }
}

export function productFromDb(item: Parameters<typeof serializeMenuItem>[0]): MenuProduct {
  return serializeMenuItem(item)
}
