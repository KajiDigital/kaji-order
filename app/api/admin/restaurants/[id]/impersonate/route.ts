import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminSession, ADMIN_SESSION_COOKIE } from '@/app/lib/admin-auth'
import { signToken, sessionCookieOptions } from '@/app/lib/auth'
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

  const staff = restaurant.staff[0]
  if (!staff) {
    return NextResponse.json({ error: 'No staff account to impersonate' }, { status: 400 })
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
