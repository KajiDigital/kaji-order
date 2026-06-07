import { NextResponse } from 'next/server'
import { getAdminSession } from '@/app/lib/admin-auth'
import prisma from '@/app/lib/prisma'
import { sendRegistrationRejected } from '@/app/lib/email'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function POST(_request: Request, { params }: Params) {
  const admin = await getAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const restaurant = await prisma.restaurant.findUnique({ where: { id } })

  if (!restaurant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (restaurant.status !== 'pending') {
    return NextResponse.json({ error: 'Restaurant is not pending' }, { status: 400 })
  }

  await prisma.restaurant.update({
    where: { id },
    data: { status: 'suspended' },
  })

  if (restaurant.email) {
    await sendRegistrationRejected(restaurant.email, restaurant.name)
  }

  return NextResponse.json({ success: true })
}
