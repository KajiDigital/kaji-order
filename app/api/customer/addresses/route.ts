import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { getCustomerSession } from '@/app/lib/customer-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const session = await getCustomerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const address = typeof body.address === 'string' ? body.address.trim() : ''
  const postcode = typeof body.postcode === 'string' ? body.postcode.trim().toUpperCase() : ''

  if (!address || !postcode) {
    return NextResponse.json({ error: 'Address and postcode are required' }, { status: 400 })
  }

  const existing = await prisma.customerAddress.findFirst({
    where: { customer_id: session.customerId, address, postcode },
  })
  if (existing) {
    return NextResponse.json({ address: existing })
  }

  const count = await prisma.customerAddress.count({
    where: { customer_id: session.customerId },
  })
  if (count >= 3) {
    return NextResponse.json({ error: 'You can save up to 3 addresses' }, { status: 400 })
  }

  const created = await prisma.customerAddress.create({
    data: { customer_id: session.customerId, address, postcode },
  })

  return NextResponse.json({ address: created })
}
