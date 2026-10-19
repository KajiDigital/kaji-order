import prisma from '@/app/lib/prisma'

export type MenuTagKind = 'DIETARY' | 'ALLERGEN'

export const MENU_TAG_KINDS: MenuTagKind[] = ['DIETARY', 'ALLERGEN']

export const TAG_COLORS = [
  '#10B981',
  '#059669',
  '#14B8A6',
  '#06B6D4',
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#DC2626',
  '#EA580C',
  '#EAB308',
  '#64748b',
  '#78716c',
]

/** Default dietary tags seeded for every restaurant (matches menu builder UI). */
export const DEFAULT_DIETARY_TAGS: { name: string; color: string }[] = [
  { name: 'Vegan', color: '#10B981' },
  { name: 'Vegetarian', color: '#10B981' },
  { name: 'Gluten-free', color: '#06B6D4' },
  { name: 'Spicy', color: '#DC2626' },
  { name: 'Halal', color: '#8B5CF6' },
]

/** Default allergen tags seeded for every restaurant (UK 14-style list). */
export const DEFAULT_ALLERGEN_TAGS: { name: string; color: string }[] = [
  { name: 'Gluten', color: '#78716c' },
  { name: 'Dairy', color: '#78716c' },
  { name: 'Nuts', color: '#78716c' },
  { name: 'Eggs', color: '#78716c' },
  { name: 'Soy', color: '#78716c' },
  { name: 'Fish', color: '#78716c' },
  { name: 'Shellfish', color: '#78716c' },
  { name: 'Sesame', color: '#78716c' },
  { name: 'Celery', color: '#78716c' },
  { name: 'Mustard', color: '#78716c' },
  { name: 'Lupin', color: '#78716c' },
  { name: 'Sulphites', color: '#78716c' },
]

function tagKey(kind: string, name: string) {
  return `${kind}:${name.toLowerCase()}`
}

/** Idempotent — adds any missing default tags for one restaurant. */
export async function ensureDefaultMenuTags(restaurantId: string) {
  const existing = await prisma.menuTag.findMany({
    where: { restaurant_id: restaurantId },
    select: { kind: true, name: true },
  })
  const keys = new Set(existing.map((t) => tagKey(t.kind, t.name)))

  const pending: {
    restaurant_id: string
    kind: MenuTagKind
    name: string
    color: string
    sort_order: number
  }[] = []

  DEFAULT_DIETARY_TAGS.forEach((tag, i) => {
    if (!keys.has(tagKey('DIETARY', tag.name))) {
      pending.push({
        restaurant_id: restaurantId,
        kind: 'DIETARY',
        name: tag.name,
        color: tag.color,
        sort_order: i,
      })
    }
  })

  DEFAULT_ALLERGEN_TAGS.forEach((tag, i) => {
    if (!keys.has(tagKey('ALLERGEN', tag.name))) {
      pending.push({
        restaurant_id: restaurantId,
        kind: 'ALLERGEN',
        name: tag.name,
        color: tag.color,
        sort_order: i,
      })
    }
  })

  if (pending.length === 0) return

  await prisma.menuTag.createMany({ data: pending })
}

/** Backfill default tags for all active restaurants. */
export async function ensureDefaultMenuTagsForAllRestaurants() {
  const restaurants = await prisma.restaurant.findMany({
    where: { deleted_at: null },
    select: { id: true },
  })
  for (const { id } of restaurants) {
    await ensureDefaultMenuTags(id)
  }
}

export const menuTagInclude = {
  item_links: {
    select: { menu_item_id: true, sort_order: true },
    orderBy: { sort_order: 'asc' as const },
  },
} as const

export const menuItemTagInclude = {
  tag_links: {
    orderBy: { sort_order: 'asc' as const },
    include: {
      tag: true,
    },
  },
} as const

export type MenuTagInput = {
  name: string
  color?: string
  kind: MenuTagKind
  sort_order?: number
}

export function serializeMenuTag(
  tag: {
    id: string
    kind: string
    name: string
    color: string
    sort_order: number
    item_links?: { menu_item_id: string; sort_order: number }[]
  }
) {
  return {
    id: tag.id,
    kind: tag.kind as MenuTagKind,
    name: tag.name,
    color: tag.color,
    sort_order: tag.sort_order,
    linked_item_ids: tag.item_links?.map((l) => l.menu_item_id) ?? [],
  }
}

export async function createMenuTag(restaurantId: string, input: MenuTagInput) {
  const count = await prisma.menuTag.count({
    where: { restaurant_id: restaurantId, kind: input.kind },
  })

  return prisma.menuTag.create({
    data: {
      restaurant_id: restaurantId,
      kind: input.kind,
      name: input.name,
      color: input.color ?? TAG_COLORS[0],
      sort_order: input.sort_order ?? count,
    },
    include: menuTagInclude,
  })
}

export async function updateMenuTag(
  tagId: string,
  restaurantId: string,
  input: Partial<MenuTagInput>
) {
  const existing = await prisma.menuTag.findFirst({
    where: { id: tagId, restaurant_id: restaurantId },
  })
  if (!existing) return null

  return prisma.menuTag.update({
    where: { id: tagId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.sort_order !== undefined && { sort_order: input.sort_order }),
    },
    include: menuTagInclude,
  })
}

export async function deleteMenuTag(tagId: string, restaurantId: string) {
  const existing = await prisma.menuTag.findFirst({
    where: { id: tagId, restaurant_id: restaurantId },
  })
  if (!existing) return false
  await prisma.menuTag.delete({ where: { id: tagId } })
  return true
}

export async function linkTagToItem(
  menuItemId: string,
  tagId: string,
  restaurantId: string
) {
  const [item, tag] = await Promise.all([
    prisma.menuItem.findFirst({
      where: { id: menuItemId, restaurant_id: restaurantId },
    }),
    prisma.menuTag.findFirst({
      where: { id: tagId, restaurant_id: restaurantId },
    }),
  ])
  if (!item || !tag) return null

  const existing = await prisma.menuItemTag.findUnique({
    where: {
      menu_item_id_tag_id: { menu_item_id: menuItemId, tag_id: tagId },
    },
  })
  if (existing) return existing

  const count = await prisma.menuItemTag.count({
    where: { menu_item_id: menuItemId },
  })

  return prisma.menuItemTag.create({
    data: {
      menu_item_id: menuItemId,
      tag_id: tagId,
      sort_order: count,
    },
  })
}

export async function unlinkTagFromItem(
  menuItemId: string,
  tagId: string,
  restaurantId: string
) {
  const item = await prisma.menuItem.findFirst({
    where: { id: menuItemId, restaurant_id: restaurantId },
  })
  if (!item) return false

  const result = await prisma.menuItemTag.deleteMany({
    where: { menu_item_id: menuItemId, tag_id: tagId },
  })
  return result.count > 0
}
