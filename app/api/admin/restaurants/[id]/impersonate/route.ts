import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { getAdminSession, ADMIN_SESSION_COOKIE } from '@/app/lib/admin-auth'
import { hashPassword, signToken, sessionCookieOptions } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'
import { logAdminChange } from '@/app/lib/audit'
import {
  adminBackupCookieOptions,
  impersonatingCookieOptions,
} from '@/app/lib/impersonation'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function POST(_request: Request, { params }: Params) {
  const admin = await getAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const restaurant = await prisma.restaurant.findFirst({
    where: { id, deleted_at: null },
    include: { staff: { take: 1, orderBy: { created_at: 'asc' } } },
  })

  if (!restaurant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const staffRecord = restaurant.staff[0]
  let staff = staffRecord

  if (!staff) {
    if (!restaurant.email) {
      return NextResponse.json(
        { error: 'No staff account — add a restaurant email first, then try again' },
        { status: 400 }
      )
    }

    const hashed = await hashPassword(randomBytes(12).toString('base64url'))
    staff = await prisma.restaurantStaff.create({
      data: {
        restaurant_id: id,
        email: restaurant.email,
        password: hashed,
        name: restaurant.contact_name ?? restaurant.name,
        role: 'OWNER',
        password_set: false,
      },
    })
  }

  const cookieStore = await cookies()
  const adminToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  if (!adminToken) {
    return NextResponse.json({ error: 'Admin session missing' }, { status: 401 })
  }

  logAdminChange(admin.email, id, { action: 'impersonate', staffId: staff.id })

  const staffToken = signToken({
    staffId: staff.id,
    restaurantId: restaurant.id,
    email: staff.email,
    role: staff.role,
  })

  const response = NextResponse.json({
    success: true,
    redirect: '/dashboard',
  })

  response.cookies.set(sessionCookieOptions(staffToken))
  response.cookies.set(adminBackupCookieOptions(adminToken))
  response.cookies.set(
    impersonatingCookieOptions({
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
    })
  )
  response.cookies.set(ADMIN_SESSION_COOKIE, '', { httpOnly: true, maxAge: 0, path: '/' })

  return response
}
