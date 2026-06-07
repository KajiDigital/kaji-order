import { NextResponse } from 'next/server'
import { getAdminSession } from '@/app/lib/admin-auth'
import prisma from '@/app/lib/prisma'
import { logAdminChange } from '@/app/lib/audit'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function POST(_request: Request, { params }: Params) {
  const admin = await getAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  logAdminChange(admin.email, id, { action: 'suspend', status: 'suspended' })

  const restaurant = await prisma.restaurant.update({
    where: { id },
    data: { status: 'suspended' },
  })

  return NextResponse.json({ restaurant })
}
