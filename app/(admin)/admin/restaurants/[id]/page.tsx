export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import prisma from '@/app/lib/prisma'
import { sumPlatformRevenue } from '@/app/lib/commission'
import { getPlatformSettings } from '@/app/lib/platform'
import { AdminRestaurantDetail } from '@/app/components/admin/AdminRestaurantDetail'

type Params = { params: Promise<{ id: string }> }

export default async function AdminRestaurantPage({ params }: Params) {
  const { id } = await params
  const month = new Date().toISOString().slice(0, 7)

  const restaurant = await prisma.restaurant.findFirst({
    where: { id, deleted_at: null },
    include: {
      staff: { select: { last_login_at: true }, take: 1, orderBy: { created_at: 'asc' } },
      orders: { orderBy: { created_at: 'desc' }, take: 50 },
      commission_records: true,
      promotions: {
        include: {
          coupon_codes: true,
          _count: { select: { order_discounts: true } },
        },
        orderBy: { created_at: 'desc' },
      },
      _count: { select: { orders: true } },
    },
  })

  if (!restaurant) notFound()

  const ordersThisMonth = await prisma.onlineOrder.count({
    where: {
      restaurant_id: id,
      created_at: { gte: new Date(`${month}-01`) },
    },
  })

  const totalCommissionOwed = sumPlatformRevenue(
    restaurant.commission_records.filter((r) => r.status === 'PENDING')
  )

  const monthRecords = restaurant.commission_records.filter((r) => r.period_month === month)
  const monthRevenue = sumPlatformRevenue(monthRecords)
  const platformSettings = await getPlatformSettings()

  return (
    <AdminRestaurantDetail
      restaurant={{
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        status: restaurant.status,
        contact_name: restaurant.contact_name,
        email: restaurant.email,
        phone: restaurant.phone,
        restaurant_type: restaurant.restaurant_type,
        pricing_plan: restaurant.pricing_plan,
        commission_pct: restaurant.commission_pct,
        admin_notes: restaurant.admin_notes,
        logo_url: restaurant.logo_url,
        banner_url: restaurant.banner_url,
        primary_color: restaurant.primary_color,
        brand_color: restaurant.brand_color,
        font_choice: restaurant.font_choice,
        show_powered_by: restaurant.show_powered_by,
        created_at: restaurant.created_at.toISOString(),
        promotions: restaurant.promotions.map((p) => ({
          id: p.id,
          name: p.name,
          promo_type: p.promo_type,
          active: p.active,
          uses_count: p.uses_count,
          max_uses: p.max_uses,
          badge_text: p.badge_text,
          coupon_codes: p.coupon_codes.map((c) => ({
            code: c.code,
            uses_count: c.uses_count,
            max_uses: c.max_uses,
          })),
          order_discount_count: p._count.order_discounts,
        })),
        orders: restaurant.orders.map((o) => ({
          id: o.id,
          order_number: o.order_number,
          customer_name: o.customer_name,
          total_pence: o.total_pence,
          status: o.status,
          stripe_payment_status: o.stripe_payment_status,
          refund_reason: o.refund_reason,
          refund_amount_pence: o.refund_amount_pence,
          created_at: o.created_at.toISOString(),
        })),
      }}
      stats={{
        totalOrders: restaurant._count.orders,
        ordersThisMonth,
        totalCommissionOwed: totalCommissionOwed.totalPlatform,
        commissionThisMonth: monthRevenue.foodCommission,
        serviceFeesThisMonth: monthRevenue.serviceFees,
        totalPlatformThisMonth: monthRevenue.totalPlatform,
        platformServiceFeePence: platformSettings.service_fee_pence,
        lastLogin: restaurant.staff[0]?.last_login_at?.toISOString() ?? null,
      }}
    />
  )
}
