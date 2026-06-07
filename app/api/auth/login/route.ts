import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import {
  verifyPassword,
  signToken,
  sessionCookieOptions,
} from '@/app/lib/auth'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }

    const staff = await prisma.restaurantStaff.findUnique({
      where: { email },
      include: { restaurant: true },
    })

    if (!staff || !(await verifyPassword(password, staff.password))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (staff.restaurant.status !== 'active') {
      return NextResponse.json(
        { error: "Your account is not yet active. We'll email you when approved." },
        { status: 403 }
      )
    }

    const token = signToken({
      staffId: staff.id,
      restaurantId: staff.restaurant_id,
      email: staff.email,
      role: staff.role,
    })

    const response = NextResponse.json({
      success: true,
      restaurant: {
        id: staff.restaurant.id,
        name: staff.restaurant.name,
        slug: staff.restaurant.slug,
      },
    })

    response.cookies.set(sessionCookieOptions(token))
    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
