import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { getOpenStatus } from '@/app/lib/opening-hours'
import { getServiceFeePence } from '@/app/lib/platform'

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
            where: { is_available: true },
            orderBy: { sort_order: 'asc' },
            include: {
              modifier_groups: {
                orderBy: { sort_order: 'asc' },
                include: { modifiers: { orderBy: { sort_order: 'asc' } } },
              },
            },
          },
        },
      },
    },
  })

  if (!restaurant || restaurant.status !== 'active') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

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
    categories: restaurant.menu_categories,
  })
}
