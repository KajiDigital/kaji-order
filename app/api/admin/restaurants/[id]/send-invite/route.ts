import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getAdminSession } from '@/app/lib/admin-auth'
import { hashPassword } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'
import { logAdminChange } from '@/app/lib/audit'
import { sendRegistrationApproved } from '@/app/lib/email'

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

  if (!restaurant?.email) {
    return NextResponse.json({ error: 'Not found or no email' }, { status: 404 })
  }

  let staff = restaurant.staff[0]
  const tempPassword = randomBytes(6).toString('base64url')
  const hashed = await hashPassword(tempPassword)

  if (!staff) {
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
    await prisma.restaurant.update({
      where: { id },
      data: { status: 'active' },
    })
  } else {
    await prisma.restaurantStaff.update({
      where: { id: staff.id },
      data: { password: hashed, password_set: false },
    })
  }

  await sendRegistrationApproved(restaurant.email, restaurant.name, tempPassword)
  logAdminChange(admin.email, id, { action: 'send_invite' })

  return NextResponse.json({ success: true })
}
