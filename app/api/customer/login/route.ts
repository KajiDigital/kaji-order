import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import {
  findActiveRestaurantBySlug,
  verifyPassword,
  signCustomerToken,
  customerSessionCookieOptions,
} from '@/app/lib/customer-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const slug = typeof body.slug === 'string' ? body.slug.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!slug || !email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const restaurant = await findActiveRestaurantBySlug(slug)
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    const customer = await prisma.customer.findUnique({
      where: { restaurant_id_email: { restaurant_id: restaurant.id, email } },
    })

    if (
      !customer ||
      customer.deleted_at ||
      !(await verifyPassword(password, customer.password))
    ) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    await prisma.customer.update({
      where: { id: customer.id },
      data: { last_login_at: new Date() },
    })

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
    console.error('[customer/login]', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
