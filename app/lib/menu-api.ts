import prisma from '@/app/lib/prisma'
import { parsePoundsToPence } from '@/app/lib/utils'
import type { MenuProduct, PricingType } from '@/app/lib/menu-types'

export const menuItemInclude = {
  option_groups: {
    orderBy: { sort_order: 'asc' as const },
    include: { options: { orderBy: { sort_order: 'asc' as const } } },
  },
  combo_groups: {
    orderBy: { sort_order: 'asc' as const },
    include: {
      combo_options: {
        orderBy: { sort_order: 'asc' as const },
        include: { menu_item: { select: { id: true, name: true, base_price: true } } },
      },
    },
  },
}

type DbItem = {
  id: string
  name: string
  description: string | null
  base_price: number
  image_url: string | null
  available: boolean
  is_bundle: boolean
  featured: boolean
  calories: number | null
  allergens: unknown
  spice_level: number | null
  is_vegan: boolean
  is_vegetarian: boolean
  is_gluten_free: boolean
  pricing_type: string
  option_groups: {
    id: string
    name: string
    description: string | null
    group_type: string
    required: boolean
    min_selections: number
    max_selections: number
    sort_order: number
    options: {
      id: string
      name: string
      description: string | null
      price_delta: number
      is_default: boolean
      available: boolean
      image_url: string | null
      linked_item_id: string | null
      sort_order: number
    }[]
  }[]
  combo_groups: {
    id: string
    name: string
    required: boolean
    min_items: number
    max_items: number
    source_type: string
    source_category_id: string | null
    sort_order: number
    combo_options: {
      id: string
      menu_item_id: string
      price_override: number | null
      sort_order: number
      menu_item: { id: string; name: string; base_price: number }
    }[]
  }[]
}

export function serializeMenuItem(item: DbItem): MenuProduct {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    base_price: item.base_price,
    image_url: item.image_url,
    available: item.available,
    is_bundle: item.is_bundle,
    featured: item.featured,
    calories: item.calories,
    allergens: Array.isArray(item.allergens) ? (item.allergens as string[]) : null,
    spice_level: item.spice_level,
    is_vegan: item.is_vegan,
    is_vegetarian: item.is_vegetarian,
    is_gluten_free: item.is_gluten_free,
    pricing_type: item.pricing_type as PricingType,
    option_groups: item.option_groups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      group_type: g.group_type as MenuProduct['option_groups'][0]['group_type'],
      required: g.required,
      min_selections: g.min_selections,
      max_selections: g.max_selections,
      sort_order: g.sort_order,
      options: g.options.map((o) => ({
        id: o.id,
        name: o.name,
        description: o.description,
        price_delta: o.price_delta,
        is_default: o.is_default,
        available: o.available,
        image_url: o.image_url,
        linked_item_id: o.linked_item_id,
        sort_order: o.sort_order,
      })),
    })),
    combo_groups: item.combo_groups.map((g) => ({
      id: g.id,
      name: g.name,
      required: g.required,
      min_items: g.min_items,
      max_items: g.max_items,
      source_type: g.source_type as MenuProduct['combo_groups'][0]['source_type'],
      source_category_id: g.source_category_id,
      sort_order: g.sort_order,
      combo_options: g.combo_options.map((o) => ({
        id: o.id,
        menu_item_id: o.menu_item_id,
        name: o.menu_item.name,
        base_price: o.menu_item.base_price,
        price_override: o.price_override,
        sort_order: o.sort_order,
      })),
    })),
  }
}

type OptionGroupInput = {
  name: string
  description?: string
  group_type?: string
  required?: boolean
  min_selections?: number
  max_selections?: number
  options?: {
    name: string
    description?: string
    price?: string | number
    price_delta?: number
    is_default?: boolean
    available?: boolean
  }[]
}

type ComboGroupInput = {
  name: string
  required?: boolean
  min_items?: number
  max_items?: number
  source_type?: string
  source_category_id?: string | null
  combo_options?: { menu_item_id: string; price_override?: number | null }[]
}

export function parseMenuItemFields(body: Record<string, unknown>) {
  const price =
    body.base_price !== undefined
      ? Number(body.base_price)
      : body.price_pence !== undefined
        ? Number(body.price_pence)
        : body.price !== undefined
          ? parsePoundsToPence(String(body.price))
          : undefined

  return {
    ...(body.name !== undefined && { name: String(body.name) }),
    ...(body.description !== undefined && { description: body.description ? String(body.description) : null }),
    ...(body.category_id !== undefined && { category_id: String(body.category_id) }),
    ...(price !== undefined && { base_price: price }),
    ...(body.image_url !== undefined && { image_url: body.image_url ? String(body.image_url) : null }),
    ...(body.available !== undefined && { available: Boolean(body.available) }),
    ...(body.is_available !== undefined && { available: Boolean(body.is_available) }),
    ...(body.is_bundle !== undefined && { is_bundle: Boolean(body.is_bundle) }),
    ...(body.featured !== undefined && { featured: Boolean(body.featured) }),
    ...(body.calories !== undefined && { calories: body.calories ? Number(body.calories) : null }),
    ...(body.allergens !== undefined && { allergens: body.allergens }),
    ...(body.spice_level !== undefined && { spice_level: body.spice_level !== null ? Number(body.spice_level) : null }),
    ...(body.is_vegan !== undefined && { is_vegan: Boolean(body.is_vegan) }),
    ...(body.is_vegetarian !== undefined && { is_vegetarian: Boolean(body.is_vegetarian) }),
    ...(body.is_gluten_free !== undefined && { is_gluten_free: Boolean(body.is_gluten_free) }),
    ...(body.pricing_type !== undefined && { pricing_type: String(body.pricing_type) }),
    ...(body.sort_order !== undefined && { sort_order: Number(body.sort_order) }),
  }
}

export async function replaceOptionGroups(itemId: string, groups: OptionGroupInput[]) {
  await prisma.optionGroup.deleteMany({ where: { item_id: itemId } })
  for (const [gi, g] of groups.entries()) {
    await prisma.optionGroup.create({
      data: {
        item_id: itemId,
        name: g.name,
        description: g.description ?? null,
        group_type: g.group_type ?? 'SINGLE',
        required: g.required ?? false,
        min_selections: g.min_selections ?? (g.required ? 1 : 0),
        max_selections: g.max_selections ?? 1,
        sort_order: gi,
        options: {
          create: (g.options ?? []).map((o, oi) => ({
            name: o.name,
            description: o.description ?? null,
            price_delta: o.price_delta ?? parsePoundsToPence(String(o.price ?? 0)),
            is_default: o.is_default ?? false,
            available: o.available ?? true,
            sort_order: oi,
          })),
        },
      },
    })
  }
}

export async function replaceComboGroups(itemId: string, groups: ComboGroupInput[]) {
  await prisma.comboGroup.deleteMany({ where: { item_id: itemId } })
  for (const [gi, g] of groups.entries()) {
    await prisma.comboGroup.create({
      data: {
        item_id: itemId,
        name: g.name,
        required: g.required ?? true,
        min_items: g.min_items ?? 1,
        max_items: g.max_items ?? 1,
        source_type: g.source_type ?? 'ITEMS',
        source_category_id: g.source_category_id ?? null,
        sort_order: gi,
        combo_options: {
          create: (g.combo_options ?? []).map((o, oi) => ({
            menu_item_id: o.menu_item_id,
            price_override: o.price_override ?? null,
            sort_order: oi,
          })),
        },
      },
    })
  }
}

export async function fetchMenuItemById(id: string, restaurantId: string) {
  return prisma.menuItem.findFirst({
    where: { id, restaurant_id: restaurantId },
    include: menuItemInclude,
  })
}
