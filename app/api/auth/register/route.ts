import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import {
  hashPassword,
  signToken,
  sessionCookieOptions,
} from '@/app/lib/auth'
import { slugify, getCommissionPct } from '@/app/lib/utils'
import { defaultOpeningHours } from '@/app/lib/utils'
import type { PricingPlan } from '@prisma/client'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, slug: rawSlug, phone, pricing_plan } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email and password are required' },
        { status: 400 }
      )
    }

    const slug = slugify(rawSlug || name)
    if (!slug || slug.length < 2) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
    }

    const existingSlug = await prisma.restaurant.findUnique({ where: { slug } })
    if (existingSlug) {
      return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })
    }

    const existingStaff = await prisma.restaurantStaff.findUnique({
      where: { email },
    })
    if (existingStaff) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const plan = (pricing_plan ?? 'COMMISSION') as PricingPlan
    const commissionPct = getCommissionPct(plan)
    const hashed = await hashPassword(password)

    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        slug,
        email,
        phone: phone ?? null,
        pricing_plan: plan,
        commission_pct: commissionPct,
        opening_hours: defaultOpeningHours(),
        staff: {
          create: {
            email,
            password: hashed,
            name,
            role: 'OWNER',
          },
        },
      },
      include: { staff: true },
    })

    const staff = restaurant.staff[0]
    const token = signToken({
      staffId: staff.id,
      restaurantId: restaurant.id,
      email: staff.email,
      role: staff.role,
    })

    const response = NextResponse.json({
      success: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        pricing_plan: restaurant.pricing_plan,
      },
    })

    response.cookies.set(sessionCookieOptions(token))
    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
