export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import prisma from '@/app/lib/prisma'
import { isRestaurantOpen } from '@/app/lib/hours'
import { getPrimaryColor, getSecondaryColor, shouldShowPoweredBy } from '@/app/lib/branding'
import { PublicMenuClient } from '@/app/components/public/PublicMenuClient'

type Params = { params: Promise<{ slug: string }> }

export default async function PublicMenuPage({ params }: Params) {
  const { slug } = await params

  const restaurant = await prisma.restaurant.findFirst({
    where: { slug, deleted_at: null },
    include: {
      menu_categories: {
        where: { is_active: true },
        orderBy: { sort_order: 'asc' },
        include: {
          items: {
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

  if (!restaurant || restaurant.status !== 'active' || restaurant.deleted_at) notFound()

  const openStatus = isRestaurantOpen(restaurant.opening_hours, restaurant.holiday_mode)

  return (
    <PublicMenuClient
      restaurant={{
        slug: restaurant.slug,
        name: restaurant.name,
        description: restaurant.description,
        logo_url: restaurant.logo_url,
        banner_url: restaurant.banner_url,
        primary_color: getPrimaryColor(restaurant),
        secondary_color: getSecondaryColor(restaurant),
        font_choice: restaurant.font_choice ?? 'default',
        show_powered_by: shouldShowPoweredBy(restaurant),
        phone: restaurant.phone,
        email: restaurant.email,
        isOpen: openStatus.open && restaurant.collection_enabled,
        closedReason: openStatus.reason,
        holiday_mode: restaurant.holiday_mode,
        holiday_message: restaurant.holiday_message,
        min_order_pence: restaurant.min_order_pence,
        avg_prep_minutes: restaurant.avg_prep_minutes,
      }}
      categories={restaurant.menu_categories}
    />
  )
}
