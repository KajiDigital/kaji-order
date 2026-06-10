import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'
import { generateCouponCode } from '@/app/lib/promotions'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const promotion = await prisma.promotion.findFirst({
    where: { id, restaurant_id: session.restaurantId },
  })

  if (!promotion) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const coupons = await prisma.couponCode.findMany({
    where: { promotion_id: id },
    orderBy: { created_at: 'desc' },
  })

  return NextResponse.json({ coupons })
}

export async function POST(request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  const promotion = await prisma.promotion.findFirst({
    where: { id, restaurant_id: session.restaurantId },
  })

  if (!promotion) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const code = (body.generate ? generateCouponCode() : body.code)?.toUpperCase().trim()
  if (!code) {
    return NextResponse.json({ error: 'Code required' }, { status: 400 })
  }

  const coupon = await prisma.couponCode.create({
    data: {
      restaurant_id: session.restaurantId,
      promotion_id: id,
      code,
      max_uses: body.max_uses ?? null,
      valid_from: body.valid_from ? new Date(body.valid_from) : null,
      valid_until: body.valid_until ? new Date(body.valid_until) : null,
      active: true,
    },
  })

  return NextResponse.json({ coupon })
}
