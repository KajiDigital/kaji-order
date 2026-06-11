import type {
  BasketSelection,
  ComboOptionItem,
  MenuComboGroup,
  MenuProduct,
  PricingType,
} from './menu-types'

export function sumOptionDeltas(selections: BasketSelection[]): number {
  return selections
    .filter((s) => s.kind === 'option')
    .reduce((sum, s) => sum + s.price_delta, 0)
}

export function calcUnitPrice(
  basePrice: number,
  pricingType: PricingType,
  selections: BasketSelection[]
): number {
  if (pricingType === 'BUNDLE' || pricingType === 'FIXED') {
    return basePrice
  }
  return basePrice + sumOptionDeltas(selections)
}

export function calcLineTotal(
  basePrice: number,
  pricingType: PricingType,
  selections: BasketSelection[],
  quantity: number
): { options_price: number; total_price: number } {
  const options_price = pricingType === 'OPTIONS' ? sumOptionDeltas(selections) : 0
  const unit = basePrice + options_price
  return {
    options_price,
    total_price: unit * quantity,
  }
}

export function calcMinMaxPrice(product: MenuProduct): { min: number; max: number; minLabel?: string; maxLabel?: string } {
  if (product.pricing_type === 'BUNDLE' || product.is_bundle) {
    return { min: product.base_price, max: product.base_price }
  }

  if (product.pricing_type === 'FIXED' || product.option_groups.length === 0) {
    return { min: product.base_price, max: product.base_price }
  }

  let minDelta = 0
  let maxDelta = 0
  let minLabel = ''
  let maxLabel = ''

  for (const group of product.option_groups) {
    const available = group.options.filter((o) => o.available !== false)
    if (available.length === 0) continue

    const deltas = available.map((o) => o.price_delta)
    const defaults = available.filter((o) => o.is_default)

    if (group.group_type === 'SINGLE' || group.max_selections === 1) {
      const pick = defaults[0] ?? available.reduce((a, b) => (a.price_delta <= b.price_delta ? a : b))
      const maxPick = available.reduce((a, b) => (a.price_delta >= b.price_delta ? a : b))
      minDelta += pick.price_delta
      maxDelta += maxPick.price_delta
      if (!minLabel) minLabel = pick.name
      maxLabel = maxPick.name
    } else {
      const sorted = [...deltas].sort((a, b) => a - b)
      const minCount = Math.max(group.min_selections, group.required ? 1 : 0)
      const maxCount = Math.min(group.max_selections, available.length)
      minDelta += sorted.slice(0, minCount).reduce((s, d) => s + d, 0)
      maxDelta += sorted.slice(-maxCount).reduce((s, d) => s + d, 0)
    }
  }

  return {
    min: product.base_price + minDelta,
    max: product.base_price + maxDelta,
    minLabel: minLabel || undefined,
    maxLabel: maxLabel || undefined,
  }
}

export function displayOptionPrice(basePrice: number, priceDelta: number, pricingType: PricingType): number {
  if (pricingType === 'BUNDLE') return basePrice
  return basePrice + priceDelta
}

export function resolveComboItems(
  group: MenuComboGroup,
  allProducts: MenuProduct[],
  categoryItems?: MenuProduct[]
): ComboOptionItem[] {
  if (group.source_type === 'ITEMS') {
    return group.combo_options
  }
  if (group.source_type === 'CATEGORY' && categoryItems) {
    return categoryItems.map((p, i) => ({
      id: `cat-${p.id}`,
      menu_item_id: p.id,
      name: p.name,
      base_price: p.base_price,
      sort_order: i,
    }))
  }
  if (group.source_type === 'ANY') {
    return allProducts.map((p, i) => ({
      id: `any-${p.id}`,
      menu_item_id: p.id,
      name: p.name,
      base_price: p.base_price,
      sort_order: i,
    }))
  }
  return group.combo_options
}
