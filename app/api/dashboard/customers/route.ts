import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const customers = await prisma.customer.findMany({
    where: { restaurant_id: session.restaurantId, deleted_at: null },
    select: { id: true, name: true, email: true, phone: true },
    orderBy: { name: 'asc' },
    take: 200,
  })

  return NextResponse.json({ customers })
}
