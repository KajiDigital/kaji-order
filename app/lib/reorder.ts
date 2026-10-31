import prisma from './prisma'
import { serializeMenuItem, menuItemInclude } from './menu-api'
import { calcLineTotal } from './menu-pricing'
import { isValidSelections } from './menu-selections'
import type { BasketItemPayload, BasketSelection, PricingType } from './menu-types'

export type ReorderUnavailable = {
  name: string
  quantity: number
  reason: string
}

export type ReorderResult = {
  available: BasketItemPayload[]
  unavailable: ReorderUnavailable[]
}

function asSelections(raw: unknown): BasketSelection[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((item) => item && typeof item === 'object') as BasketSelection[]
}

export async function buildReorder(
  restaurantId: string,
  orderId: string
): Promise<ReorderResult | null> {
  const order = await prisma.onlineOrder.findFirst({
    where: { id: orderId, restaurant_id: restaurantId },
    include: { items: true },
  })
  if (!order) return null

  const menuIds = order.items
    .map((item) => item.menu_item_id)
    .filter((id): id is string => Boolean(id))

  const dbItems = menuIds.length
    ? await prisma.menuItem.findMany({
        where: { id: { in: menuIds }, restaurant_id: restaurantId },
        include: {
          ...menuItemInclude,
          category: { select: { is_active: true } },
        },
      })
    : []

  const productMap = new Map(dbItems.map((item) => [item.id, item]))
  const available: BasketItemPayload[] = []
  const unavailable: ReorderUnavailable[] = []

  for (const line of order.items) {
    if (!line.menu_item_id) {
      unavailable.push({
        name: line.name,
        quantity: line.quantity,
        reason: 'No longer on the menu',
      })
      continue
    }

    const dbItem = productMap.get(line.menu_item_id)
    if (!dbItem || !dbItem.category.is_active) {
      unavailable.push({
        name: line.name,
        quantity: line.quantity,
        reason: 'No longer on the menu',
      })
      continue
    }

    if (!dbItem.available) {
      unavailable.push({
        name: dbItem.name,
        quantity: line.quantity,
        reason: 'Currently unavailable',
      })
      continue
    }

    const product = serializeMenuItem(dbItem)
    const selections = asSelections(line.selections)
    if (!isValidSelections(product, selections)) {
      unavailable.push({
        name: dbItem.name,
        quantity: line.quantity,
        reason: 'Options have changed — add this again from the menu',
      })
      continue
    }

    const pricingType = (product.pricing_type ??
      (product.is_bundle ? 'BUNDLE' : 'OPTIONS')) as PricingType
    const priced = calcLineTotal(product.base_price, pricingType, selections, line.quantity)

    available.push({
      id: crypto.randomUUID(),
      menuItemId: product.id,
      name: product.name,
      base_price: product.base_price,
      quantity: line.quantity,
      selections,
      options_price: priced.options_price,
      total_price: priced.total_price,
      notes: line.notes ?? undefined,
      categoryId: dbItem.category_id,
    })
  }

  return { available, unavailable }
}
