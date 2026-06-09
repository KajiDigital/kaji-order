import { NextResponse } from 'next/server'
import { getAdminSession } from '@/app/lib/admin-auth'
import prisma from '@/app/lib/prisma'
import { logAdminChange } from '@/app/lib/audit'
import { sumPlatformRevenue } from '@/app/lib/commission'
import { slugify, getCommissionPct } from '@/app/lib/utils'
import type { PricingPlan } from '@prisma/client'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const admin = await getAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const month = new Date().toISOString().slice(0, 7)

  const restaurant = await prisma.restaurant.findFirst({
    where: { id, deleted_at: null },
    include: {
      staff: { select: { last_login_at: true, email: true }, take: 1, orderBy: { created_at: 'asc' } },
      orders: { orderBy: { created_at: 'desc' }, take: 50 },
      commission_records: true,
      _count: { select: { orders: true } },
    },
  })

  if (!restaurant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const ordersThisMonth = await prisma.onlineOrder.count({
    where: {
      restaurant_id: id,
      created_at: { gte: new Date(`${month}-01`) },
    },
  })

  const totalCommissionOwed = sumPlatformRevenue(
    restaurant.commission_records.filter((r) => r.status === 'PENDING')
  )

  const monthRevenue = sumPlatformRevenue(
    restaurant.commission_records.filter((r) => r.period_month === month)
  )

  return NextResponse.json({
    restaurant,
    stats: {
      totalOrders: restaurant._count.orders,
      ordersThisMonth,
      totalCommissionOwed: totalCommissionOwed.totalPlatform,
      commissionThisMonth: monthRevenue.foodCommission,
      serviceFeesThisMonth: monthRevenue.serviceFees,
      totalPlatformThisMonth: monthRevenue.totalPlatform,
      lastLogin: restaurant.staff[0]?.last_login_at ?? null,
    },
  })
}

export async function PATCH(request: Request, { params }: Params) {
  const admin = await getAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  const existing = await prisma.restaurant.findFirst({
    where: { id, deleted_at: null },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const data: Record<string, unknown> = {}

  if (body.name !== undefined) data.name = body.name
  if (body.contact_name !== undefined) data.contact_name = body.contact_name
  if (body.email !== undefined) data.email = body.email
  if (body.phone !== undefined) data.phone = body.phone
  if (body.restaurant_type !== undefined) data.restaurant_type = body.restaurant_type
  if (body.slug !== undefined) {
    const slug = slugify(body.slug)
    if (slug.length < 2) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
    }
    const taken = await prisma.restaurant.findFirst({
      where: { slug, id: { not: id } },
    })
    if (taken) {
      return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })
    }
    data.slug = slug
  }
  if (body.status !== undefined) {
    if (!['pending', 'active', 'suspended'].includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    data.status = body.status
  }
  if (body.pricing_plan !== undefined) {
    data.pricing_plan = body.pricing_plan as PricingPlan
    if (body.commission_pct === undefined) {
      data.commission_pct = getCommissionPct(body.pricing_plan)
    }
  }
  if (body.commission_pct !== undefined) data.commission_pct = body.commission_pct
  if (body.admin_notes !== undefined) data.admin_notes = body.admin_notes
  if (body.primary_color !== undefined) {
    data.primary_color = body.primary_color
    data.brand_color = body.primary_color
  }
  if (body.secondary_color !== undefined) data.secondary_color = body.secondary_color
  if (body.font_choice !== undefined) data.font_choice = body.font_choice
  if (body.logo_url !== undefined) data.logo_url = body.logo_url
  if (body.banner_url !== undefined) data.banner_url = body.banner_url
  if (body.show_powered_by !== undefined) data.show_powered_by = body.show_powered_by

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  logAdminChange(admin.email, id, data)

  const restaurant = await prisma.restaurant.update({
    where: { id },
    data,
  })

  if (body.contact_name !== undefined && existing.email) {
    await prisma.restaurantStaff.updateMany({
      where: { restaurant_id: id, role: 'OWNER' },
      data: { name: body.contact_name },
    })
  }

  return NextResponse.json({ restaurant })
}
