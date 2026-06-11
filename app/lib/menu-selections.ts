import { formatPence } from './utils'
import type {
  BasketSelection,
  MenuComboGroup,
  MenuOptionGroup,
  MenuProduct,
  SelectionSnapshot,
} from './menu-types'
import { calcUnitPrice } from './menu-pricing'

export type ValidationError = {
  group_id: string
  group_name: string
  message: string
}

export function validateSelections(
  product: MenuProduct,
  selections: BasketSelection[]
): ValidationError[] {
  const errors: ValidationError[] = []

  for (const group of product.option_groups) {
    const picked = selections.filter((s) => s.kind === 'option' && s.group_id === group.id)
    const count = picked.length

    if (group.required && count === 0) {
      errors.push({ group_id: group.id, group_name: group.name, message: 'Please make a selection' })
      continue
    }

    if (count > 0 && count < group.min_selections) {
      errors.push({
        group_id: group.id,
        group_name: group.name,
        message: `Select at least ${group.min_selections}`,
      })
    }

    if (count > group.max_selections) {
      errors.push({
        group_id: group.id,
        group_name: group.name,
        message: `Select at most ${group.max_selections}`,
      })
    }
  }

  for (const group of product.combo_groups) {
    const picked = selections.filter((s) => s.kind === 'combo' && s.group_id === group.id)
    const count = picked.length

    if (group.required && count === 0) {
      errors.push({ group_id: group.id, group_name: group.name, message: 'Please make a selection' })
      continue
    }

    if (count > 0 && count < group.min_items) {
      errors.push({
        group_id: group.id,
        group_name: group.name,
        message: `Select at least ${group.min_items}`,
      })
    }

    if (count > group.max_items) {
      errors.push({
        group_id: group.id,
        group_name: group.name,
        message: `Select at most ${group.max_items}`,
      })
    }
  }

  return errors
}

export function isValidSelections(product: MenuProduct, selections: BasketSelection[]): boolean {
  return validateSelections(product, selections).length === 0
}

export function buildOptionSelection(
  group: MenuOptionGroup,
  optionId: string
): BasketSelection | null {
  const option = group.options.find((o) => o.id === optionId)
  if (!option) return null
  return {
    kind: 'option',
    group: group.name,
    group_id: group.id,
    option: option.name,
    option_id: option.id,
    price_delta: option.price_delta,
  }
}

export function buildComboSelection(
  group: MenuComboGroup,
  menuItemId: string,
  itemName: string
): BasketSelection {
  return {
    kind: 'combo',
    group: group.name,
    group_id: group.id,
    item_id: menuItemId,
    item_name: itemName,
    price_delta: 0,
  }
}

export function formatSelectionsText(selections: SelectionSnapshot[] | null | undefined): string | null {
  if (!selections?.length) return null
  return selections
    .map((s) => {
      if (s.kind === 'combo') return s.item_name ?? s.option ?? s.group
      return s.option ?? s.group
    })
    .join(', ')
}

export function formatSelectionsLines(
  selections: SelectionSnapshot[] | null | undefined
): string[] {
  if (!selections?.length) return []
  return selections.map((s) => {
    if (s.kind === 'combo') {
      return `→ ${s.item_name ?? s.option ?? s.group}`
    }
    if (s.price_delta > 0) {
      return `→ + ${s.option} (+${formatPence(s.price_delta)})`
    }
    if (s.price_delta < 0) {
      return `→ ${s.option} (${formatPence(s.price_delta)})`
    }
    return `→ ${s.option ?? s.group}`
  })
}

export function normalizeLegacyModifiers(
  modifiers: { groupName?: string; name: string; priceDeltaPence?: number; groupId?: string; modifierId?: string }[]
): BasketSelection[] {
  return modifiers.map((m) => ({
    kind: 'option' as const,
    group: m.groupName ?? 'Option',
    group_id: m.groupId,
    option: m.name,
    option_id: m.modifierId,
    price_delta: m.priceDeltaPence ?? 0,
  }))
}

export function repriceBasketItem(
  product: Pick<MenuProduct, 'base_price' | 'pricing_type' | 'is_bundle'>,
  selections: BasketSelection[],
  quantity: number
) {
  const pricingType = product.pricing_type ?? (product.is_bundle ? 'BUNDLE' : 'OPTIONS')
  const options_price =
    pricingType === 'OPTIONS'
      ? selections.filter((s) => s.kind === 'option').reduce((s, x) => s + x.price_delta, 0)
      : 0
  const unit = calcUnitPrice(product.base_price, pricingType, selections)
  return {
    options_price,
    total_price: unit * quantity,
  }
}
