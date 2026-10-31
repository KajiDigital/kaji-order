import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import {
  findActiveRestaurantBySlug,
  hashPassword,
  signCustomerToken,
  customerSessionCookieOptions,
  linkGuestOrdersToCustomer,
} from '@/app/lib/customer-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const slug = typeof body.slug === 'string' ? body.slug.trim() : ''
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''

    if (!slug || !name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const restaurant = await findActiveRestaurantBySlug(slug)
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    const existing = await prisma.customer.findUnique({
      where: { restaurant_id_email: { restaurant_id: restaurant.id, email } },
    })
    if (existing && !existing.deleted_at) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const hashed = await hashPassword(password)
    const now = new Date()
    const customer = existing
      ? await prisma.customer.update({
          where: { id: existing.id },
          data: {
            name,
            password: hashed,
            phone: phone || null,
            deleted_at: null,
            last_login_at: now,
          },
        })
      : await prisma.customer.create({
          data: {
            restaurant_id: restaurant.id,
            email,
            password: hashed,
            name,
            phone: phone || null,
            last_login_at: now,
          },
        })

    await linkGuestOrdersToCustomer(restaurant.id, customer.id, email)

    const token = signCustomerToken({
      customerId: customer.id,
      restaurantId: restaurant.id,
      email: customer.email,
      slug: restaurant.slug,
    })

    const response = NextResponse.json({
      success: true,
      customer: { id: customer.id, name: customer.name, email: customer.email },
    })
    response.cookies.set(customerSessionCookieOptions(token))
    return response
  } catch (error) {
    console.error('[customer/register]', error)
    return NextResponse.json({ error: 'Could not create account' }, { status: 500 })
  }
}
