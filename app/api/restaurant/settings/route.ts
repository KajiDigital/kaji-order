import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.restaurantId },
  })

  if (!restaurant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ restaurant })
}

export async function PATCH(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const restaurant = await prisma.restaurant.update({
    where: { id: session.restaurantId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.slug !== undefined && { slug: body.slug }),
      ...(body.address !== undefined && { address: body.address }),
      ...(body.postcode !== undefined && { postcode: body.postcode }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.logo_url !== undefined && { logo_url: body.logo_url }),
      ...(body.banner_url !== undefined && { banner_url: body.banner_url }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.brand_color !== undefined && { brand_color: body.brand_color }),
      ...(body.primary_color !== undefined && {
        primary_color: body.primary_color,
        brand_color: body.primary_color,
      }),
      ...(body.secondary_color !== undefined && { secondary_color: body.secondary_color }),
      ...(body.font_choice !== undefined && { font_choice: body.font_choice }),
      ...(body.show_powered_by !== undefined && { show_powered_by: body.show_powered_by }),
      ...(body.opening_hours !== undefined && { opening_hours: body.opening_hours }),
      ...(body.holiday_mode !== undefined && { holiday_mode: body.holiday_mode }),
      ...(body.holiday_message !== undefined && { holiday_message: body.holiday_message }),
      ...(body.collection_enabled !== undefined && { collection_enabled: body.collection_enabled }),
      ...(body.accept_preorders !== undefined && { accept_preorders: body.accept_preorders }),
      ...(body.preorder_days_ahead !== undefined && {
        preorder_days_ahead: Math.min(7, Math.max(1, Number(body.preorder_days_ahead) || 1)),
      }),
      ...(body.show_menu_when_closed !== undefined && { show_menu_when_closed: body.show_menu_when_closed }),
      ...(body.delivery_enabled !== undefined && { delivery_enabled: body.delivery_enabled }),
      ...(body.min_order_pence !== undefined && { min_order_pence: body.min_order_pence }),
      ...(body.avg_prep_minutes !== undefined && { avg_prep_minutes: body.avg_prep_minutes }),
      ...(body.auto_accept_orders !== undefined && { auto_accept_orders: body.auto_accept_orders }),
      ...(body.auto_accept_delay_minutes !== undefined && { auto_accept_delay_minutes: body.auto_accept_delay_minutes }),
      ...(body.accept_timeout_minutes !== undefined && { accept_timeout_minutes: body.accept_timeout_minutes }),
      ...(body.email_notifications !== undefined && { email_notifications: body.email_notifications }),
      ...(body.sound_alerts !== undefined && { sound_alerts: body.sound_alerts }),
    },
  })

  return NextResponse.json({ restaurant })
}
