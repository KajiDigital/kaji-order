import prisma from '@/app/lib/prisma'
import { parsePoundsToPence } from '@/app/lib/utils'
import type { MenuOptionGroup, OptionGroupType } from '@/app/lib/menu-types'

export const attributeSetInclude = {
  choices: { orderBy: { sort_order: 'asc' as const } },
  item_links: {
    select: { menu_item_id: true, sort_order: true },
    orderBy: { sort_order: 'asc' as const },
  },
} as const

export const menuItemAttributeInclude = {
  attribute_set_links: {
    orderBy: { sort_order: 'asc' as const },
    include: {
      attribute_set: {
        include: {
          choices: { orderBy: { sort_order: 'asc' as const } },
        },
      },
    },
  },
} as const

type AttributeSetWithChoices = {
  id: string
  name: string
  description: string | null
  group_type: string
  required: boolean
  min_selections: number
  max_selections: number
  sort_order: number
  choices: {
    id: string
    name: string
    description: string | null
    price_delta: number
    is_default: boolean
    available: boolean
    sort_order: number
  }[]
}

export function attributeSetToOptionGroup(
  set: AttributeSetWithChoices,
  linkSortOrder?: number
): MenuOptionGroup {
  return {
    id: set.id,
    name: set.name,
    description: set.description,
    group_type: set.group_type as OptionGroupType,
    required: set.required,
    min_selections: set.min_selections,
    max_selections: set.max_selections,
    sort_order: linkSortOrder ?? set.sort_order,
    options: set.choices.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      price_delta: c.price_delta,
      is_default: c.is_default,
      available: c.available,
      sort_order: c.sort_order,
    })),
  }
}

export function serializeAttributeSet(
  set: AttributeSetWithChoices & {
    item_links?: { menu_item_id: string; sort_order: number }[]
  }
) {
  return {
    id: set.id,
    name: set.name,
    description: set.description,
    group_type: set.group_type,
    required: set.required,
    min_selections: set.min_selections,
    max_selections: set.max_selections,
    sort_order: set.sort_order,
    choices: set.choices.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      price_delta: c.price_delta,
      is_default: c.is_default,
      available: c.available,
      sort_order: c.sort_order,
    })),
    linked_item_ids: set.item_links?.map((l) => l.menu_item_id) ?? [],
  }
}

export type AttributeChoiceInput = {
  id?: string
  name: string
  description?: string | null
  price?: string | number
  price_delta?: number
  is_default?: boolean
  available?: boolean
}

export type AttributeSetInput = {
  name: string
  description?: string | null
  group_type?: string
  required?: boolean
  min_selections?: number
  max_selections?: number
  choices?: AttributeChoiceInput[]
}

function groupTypeDefaults(groupType: string, required: boolean) {
  if (groupType === 'MULTIPLE') {
    return { min_selections: required ? 1 : 0, max_selections: 99 }
  }
  if (groupType === 'OPTIONAL') {
    return { min_selections: 0, max_selections: 99 }
  }
  return { min_selections: required ? 1 : 0, max_selections: 1 }
}

export async function replaceAttributeChoices(
  attributeSetId: string,
  choices: AttributeChoiceInput[]
) {
  const existing = await prisma.attributeChoice.findMany({
    where: { attribute_set_id: attributeSetId },
    select: { id: true },
  })
  const keepIds = new Set(
    choices.map((c) => c.id).filter((id): id is string => Boolean(id))
  )

  const toDelete = existing.filter((e) => !keepIds.has(e.id)).map((e) => e.id)
  if (toDelete.length) {
    await prisma.attributeChoice.deleteMany({ where: { id: { in: toDelete } } })
  }

  for (const [index, choice] of choices.entries()) {
    const priceDelta =
      choice.price_delta ??
      (choice.price !== undefined ? parsePoundsToPence(String(choice.price)) : 0)

    if (choice.id && keepIds.has(choice.id)) {
      await prisma.attributeChoice.update({
        where: { id: choice.id },
        data: {
          name: choice.name,
          description: choice.description ?? null,
          price_delta: priceDelta,
          is_default: choice.is_default ?? false,
          available: choice.available ?? true,
          sort_order: index,
        },
      })
    } else {
      await prisma.attributeChoice.create({
        data: {
          attribute_set_id: attributeSetId,
          name: choice.name,
          description: choice.description ?? null,
          price_delta: priceDelta,
          is_default: choice.is_default ?? false,
          available: choice.available ?? true,
          sort_order: index,
        },
      })
    }
  }
}

export async function createAttributeSet(restaurantId: string, input: AttributeSetInput) {
  const groupType = input.group_type ?? 'SINGLE'
  const required = input.required ?? groupType === 'SINGLE'
  const defaults = groupTypeDefaults(groupType, required)
  const count = await prisma.attributeSet.count({ where: { restaurant_id: restaurantId } })

  const set = await prisma.attributeSet.create({
    data: {
      restaurant_id: restaurantId,
      name: input.name,
      description: input.description ?? null,
      group_type: groupType,
      required,
      min_selections: input.min_selections ?? defaults.min_selections,
      max_selections: input.max_selections ?? defaults.max_selections,
      sort_order: count,
    },
  })

  if (input.choices?.length) {
    await replaceAttributeChoices(set.id, input.choices)
  }

  return prisma.attributeSet.findUniqueOrThrow({
    where: { id: set.id },
    include: attributeSetInclude,
  })
}

export async function updateAttributeSet(
  id: string,
  restaurantId: string,
  input: AttributeSetInput
) {
  const existing = await prisma.attributeSet.findFirst({
    where: { id, restaurant_id: restaurantId },
  })
  if (!existing) return null

  const groupType = input.group_type ?? existing.group_type
  const required = input.required ?? existing.required
  const defaults = groupTypeDefaults(groupType, required)

  await prisma.attributeSet.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.group_type !== undefined && { group_type: input.group_type }),
      ...(input.required !== undefined && { required: input.required }),
      ...(input.min_selections !== undefined && { min_selections: input.min_selections }),
      ...(input.max_selections !== undefined && { max_selections: input.max_selections }),
      ...(input.group_type !== undefined || input.required !== undefined
        ? {
            min_selections: input.min_selections ?? defaults.min_selections,
            max_selections: input.max_selections ?? defaults.max_selections,
          }
        : {}),
    },
  })

  if (input.choices !== undefined) {
    await replaceAttributeChoices(id, input.choices)
  }

  return prisma.attributeSet.findUniqueOrThrow({
    where: { id },
    include: attributeSetInclude,
  })
}

export async function linkAttributeSetToItem(
  menuItemId: string,
  attributeSetId: string,
  restaurantId: string
) {
  const [item, set] = await Promise.all([
    prisma.menuItem.findFirst({
      where: { id: menuItemId, restaurant_id: restaurantId },
    }),
    prisma.attributeSet.findFirst({
      where: { id: attributeSetId, restaurant_id: restaurantId },
    }),
  ])
  if (!item || !set) return null

  const count = await prisma.menuItemAttributeSet.count({
    where: { menu_item_id: menuItemId },
  })

  return prisma.menuItemAttributeSet.upsert({
    where: {
      menu_item_id_attribute_set_id: {
        menu_item_id: menuItemId,
        attribute_set_id: attributeSetId,
      },
    },
    create: {
      menu_item_id: menuItemId,
      attribute_set_id: attributeSetId,
      sort_order: count,
    },
    update: {},
    include: {
      attribute_set: { include: attributeSetInclude },
    },
  })
}

export async function unlinkAttributeSetFromItem(
  menuItemId: string,
  attributeSetId: string,
  restaurantId: string
) {
  const item = await prisma.menuItem.findFirst({
    where: { id: menuItemId, restaurant_id: restaurantId },
  })
  if (!item) return false

  await prisma.menuItemAttributeSet.deleteMany({
    where: { menu_item_id: menuItemId, attribute_set_id: attributeSetId },
  })
  return true
}
