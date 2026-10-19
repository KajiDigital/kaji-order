import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import { getPrimaryColor, getSecondaryColor, shouldShowPoweredBy } from '@/app/lib/branding'
import { getOpenStatus } from '@/app/lib/opening-hours'
import { menuItemInclude, serializeMenuItem } from '@/app/lib/menu-api'
import { getMenuPromotions } from '@/app/lib/promotions'
import { buildMenuBannerText } from '@/app/lib/promotion-config'
import { getDeliveryZoneSummary } from '@/app/lib/delivery'
import { getServiceFeePence } from '@/app/lib/platform'
import prisma from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: { id: session.restaurantId, deleted_at: null },
    include: {
      menu_categories: {
        where: { is_active: true },
        orderBy: { sort_order: 'asc' },
        include: {
          items: {
            orderBy: { sort_order: 'asc' },
            include: menuItemInclude,
          },
        },
      },
    },
  })

  if (!restaurant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const serviceFeePence = await getServiceFeePence()
  const openStatus = getOpenStatus(
    restaurant.opening_hours,
    restaurant.holiday_mode,
    restaurant.accept_preorders,
    restaurant.show_menu_when_closed,
    restaurant.collection_enabled,
    restaurant.preorder_days_ahead,
    restaurant.holiday_message,
    restaurant.delivery_enabled
  )
  const delivery = await getDeliveryZoneSummary(restaurant.id)

  const primaryColor = getPrimaryColor(restaurant)
  const rawPromotions = await getMenuPromotions(restaurant.id)
  const promotions = rawPromotions.map((p) => ({
    id: p.id,
    name: p.name,
    applies_to: p.applies_to,
    applicable_ids: Array.isArray(p.applicable_ids) ? (p.applicable_ids as string[]) : null,
    badge_text: p.badge_text,
    badge_color: p.badge_color,
    promo_type: p.promo_type,
    description: p.description,
    time_from: p.time_from,
    time_until: p.time_until,
  }))

  return NextResponse.json({
    restaurant: {
      slug: restaurant.slug,
      name: restaurant.name,
      description: restaurant.description,
      logo_url: restaurant.logo_url,
      banner_url: restaurant.banner_url,
      primary_color: primaryColor,
      secondary_color: getSecondaryColor(restaurant),
      font_choice: restaurant.font_choice ?? 'default',
      show_powered_by: shouldShowPoweredBy(restaurant),
      phone: restaurant.phone,
      email: restaurant.email,
      isLiveOpen: openStatus.isOpen,
      canOrder: openStatus.canOrder,
      isPreorderMode: openStatus.isPreorderMode,
      closedReason: openStatus.closedReason,
      closedNotice: openStatus.banner
        ? {
            title: openStatus.banner.title,
            description: openStatus.banner.description,
            badge: openStatus.banner.badge,
          }
        : undefined,
      nextOpenTime: openStatus.nextOpenTime,
      holiday_mode: restaurant.holiday_mode,
      holiday_message: restaurant.holiday_message,
      min_order_pence: restaurant.min_order_pence,
      avg_prep_minutes: restaurant.avg_prep_minutes,
      service_fee_pence: serviceFeePence,
      collection_enabled: restaurant.collection_enabled,
      delivery_enabled: restaurant.delivery_enabled,
      show_menu_images: restaurant.show_menu_images,
      delivery_fee_pence: delivery.fee_pence,
      delivery_minimum_pence: delivery.minimum_order_pence,
      delivery_from: delivery.delivery_from,
      delivery_until: delivery.delivery_until,
      delivery_available_now: delivery.window.availableNow,
      delivery_window_message: delivery.window.message,
    },
    categories: restaurant.menu_categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      items: cat.items.map((item) => serializeMenuItem(item)),
    })),
    promotions,
    promotionBannerMessages: buildMenuBannerText(rawPromotions),
  })
}
