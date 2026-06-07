import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import {
  hashPassword,
  signToken,
  sessionCookieOptions,
} from '@/app/lib/auth'
import { slugify, getCommissionPct, defaultOpeningHours } from '@/app/lib/utils'
import { isSelfServeRegistration } from '@/app/lib/platform'
import {
  sendRegistrationRequestAdmin,
  sendRegistrationRequestConfirmation,
} from '@/app/lib/email'
import type { PricingPlan } from '@prisma/client'
import { randomBytes } from 'crypto'

function uniquePendingSlug(base: string): string {
  const suffix = randomBytes(3).toString('hex')
  return `${slugify(base) || 'restaurant'}-${suffix}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const selfServe = await isSelfServeRegistration()

    if (!selfServe) {
      return handleRequestRegistration(body)
    }

    return handleSelfServeRegistration(body)
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}

async function handleRequestRegistration(body: {
  restaurant_name?: string
  contact_name?: string
  email?: string
  phone?: string
  restaurant_type?: string
  description?: string
}) {
  const { restaurant_name, contact_name, email, phone, restaurant_type, description } = body

  if (!restaurant_name || !contact_name || !email) {
    return NextResponse.json(
      { error: 'Restaurant name, your name and email are required' },
      { status: 400 }
    )
  }

  const existingStaff = await prisma.restaurantStaff.findUnique({ where: { email } })
  if (existingStaff) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const pendingWithEmail = await prisma.restaurant.findFirst({
    where: { email, status: 'pending' },
  })
  if (pendingWithEmail) {
    return NextResponse.json(
      { error: 'A registration request with this email is already pending' },
      { status: 409 }
    )
  }

  let slug = uniquePendingSlug(restaurant_name)
  while (await prisma.restaurant.findUnique({ where: { slug } })) {
    slug = uniquePendingSlug(restaurant_name)
  }

  const restaurant = await prisma.restaurant.create({
    data: {
      name: restaurant_name,
      slug,
      status: 'pending',
      contact_name,
      email,
      phone: phone ?? null,
      restaurant_type: restaurant_type ?? null,
      description: description ?? null,
      opening_hours: defaultOpeningHours(),
    },
  })

  await sendRegistrationRequestAdmin({
    restaurantName: restaurant.name,
    contactName: contact_name,
    email,
    phone: phone ?? undefined,
    restaurantType: restaurant_type ?? undefined,
    description: description ?? undefined,
    restaurantId: restaurant.id,
  })

  await sendRegistrationRequestConfirmation(email, restaurant.name)

  return NextResponse.json({
    success: true,
    mode: 'request',
    message: "Thank you! We'll be in touch within 24 hours.",
  })
}

async function handleSelfServeRegistration(body: {
  name?: string
  email?: string
  password?: string
  slug?: string
  phone?: string
  pricing_plan?: string
}) {
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

  const existingStaff = await prisma.restaurantStaff.findUnique({ where: { email } })
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
      status: 'active',
      email,
      phone: phone ?? null,
      contact_name: name,
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
    mode: 'self_serve',
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      pricing_plan: restaurant.pricing_plan,
    },
  })

  response.cookies.set(sessionCookieOptions(token))
  return response
}
