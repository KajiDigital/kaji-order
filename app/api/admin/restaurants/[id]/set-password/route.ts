import { NextResponse } from 'next/server'
import { getAdminSession } from '@/app/lib/admin-auth'
import { hashPassword } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'
import { logAdminChange } from '@/app/lib/audit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MIN_PASSWORD_LENGTH = 8

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const admin = await getAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { password?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const password = typeof body.password === 'string' ? body.password : ''
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 }
    )
  }

  const { id } = await params
  const restaurant = await prisma.restaurant.findFirst({
    where: { id, deleted_at: null },
    include: { staff: { take: 1, orderBy: { created_at: 'asc' } } },
  })

  const staff = restaurant?.staff[0]
  if (!restaurant || !staff) {
    return NextResponse.json({ error: 'No dashboard login for this restaurant' }, { status: 404 })
  }

  await prisma.restaurantStaff.update({
    where: { id: staff.id },
    data: { password: await hashPassword(password), password_set: true },
  })

  logAdminChange(admin.email, id, { action: 'set_password', staff_email: staff.email })
  return NextResponse.json({ success: true, email: staff.email })
}
