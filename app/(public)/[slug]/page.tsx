export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import prisma from '@/app/lib/prisma'
import { isRestaurantOpen } from '@/app/lib/hours'
import { PublicMenuClient } from '@/app/components/public/PublicMenuClient'

type Params = { params: Promise<{ slug: string }> }

export default async function PublicMenuPage({ params }: Params) {
  const { slug } = await params

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
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

  if (!restaurant) notFound()

  const openStatus = isRestaurantOpen(restaurant.opening_hours, restaurant.holiday_mode)

  return (
    <PublicMenuClient
      restaurant={{
        slug: restaurant.slug,
        name: restaurant.name,
        description: restaurant.description,
        logo_url: restaurant.logo_url,
        banner_url: restaurant.banner_url,
        brand_color: restaurant.brand_color,
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
