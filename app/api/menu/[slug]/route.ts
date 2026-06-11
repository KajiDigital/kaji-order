import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { getOpenStatus } from '@/app/lib/opening-hours'
import { getServiceFeePence } from '@/app/lib/platform'
import { menuItemInclude, serializeMenuItem } from '@/app/lib/menu-api'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ slug: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params

  const restaurant = await prisma.restaurant.findFirst({
    where: { slug, deleted_at: null },
    include: {
      menu_categories: {
        where: { is_active: true },
        orderBy: { sort_order: 'asc' },
        include: {
          items: {
            where: { available: true },
            orderBy: { sort_order: 'asc' },
            include: menuItemInclude,
          },
        },
      },
    },
  })

  if (!restaurant || restaurant.status !== 'active') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const allProducts = restaurant.menu_categories.flatMap((c) =>
    c.items.map((item) => serializeMenuItem(item))
  )

  const categoryItemMap = new Map<string, typeof allProducts>()
  for (const cat of restaurant.menu_categories) {
    categoryItemMap.set(
      cat.id,
      cat.items.map((item) => serializeMenuItem(item))
    )
  }

  const categories = restaurant.menu_categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    color: cat.color,
    items: cat.items.map((item) => {
      const product = serializeMenuItem(item)
      const resolvedComboGroups = product.combo_groups.map((group) => {
        if (group.source_type === 'CATEGORY' && group.source_category_id) {
          const catItems = categoryItemMap.get(group.source_category_id) ?? []
          return {
            ...group,
            combo_options: catItems.map((p, i) => ({
              id: `resolved-${p.id}`,
              menu_item_id: p.id,
              name: p.name,
              base_price: p.base_price,
              sort_order: i,
            })),
          }
        }
        if (group.source_type === 'ANY') {
          return {
            ...group,
            combo_options: allProducts
              .filter((p) => p.id !== item.id)
              .map((p, i) => ({
                id: `resolved-${p.id}`,
                menu_item_id: p.id,
                name: p.name,
                base_price: p.base_price,
                sort_order: i,
              })),
          }
        }
        return group
      })
      return { ...product, combo_groups: resolvedComboGroups }
    }),
  }))

  const openStatus = getOpenStatus(
    restaurant.opening_hours,
    restaurant.holiday_mode,
    restaurant.accept_preorders,
    restaurant.show_menu_when_closed,
    restaurant.collection_enabled,
    restaurant.preorder_days_ahead,
    restaurant.holiday_message
  )
  const serviceFeePence = await getServiceFeePence()

  return NextResponse.json({
    restaurant: {
      id: restaurant.id,
      slug: restaurant.slug,
      name: restaurant.name,
      description: restaurant.description,
      logo_url: restaurant.logo_url,
      banner_url: restaurant.banner_url,
      brand_color: restaurant.brand_color,
      primary_color: restaurant.primary_color,
      secondary_color: restaurant.secondary_color,
      font_choice: restaurant.font_choice,
      show_powered_by: restaurant.show_powered_by,
      holiday_mode: restaurant.holiday_mode,
      holiday_message: restaurant.holiday_message,
      min_order_pence: restaurant.min_order_pence,
      avg_prep_minutes: restaurant.avg_prep_minutes,
      collection_enabled: restaurant.collection_enabled,
      accept_preorders: restaurant.accept_preorders,
      show_menu_when_closed: restaurant.show_menu_when_closed,
      service_fee_pence: serviceFeePence,
      isLiveOpen: openStatus.isOpen,
      canOrder: openStatus.canOrder,
      isPreorderMode: openStatus.isPreorderMode,
      nextOpenTime: openStatus.nextOpenTime,
      closedReason: openStatus.closedReason,
    },
    categories,
  })
}
