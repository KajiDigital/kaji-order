import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { getCustomerSession } from '@/app/lib/customer-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function ownedAddress(id: string, customerId: string) {
  return prisma.customerAddress.findFirst({
    where: { id, customer_id: customerId },
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCustomerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await ownedAddress(id, session.customerId)
  if (!existing) {
    return NextResponse.json({ error: 'Address not found' }, { status: 404 })
  }

  const body = await request.json()
  const address = typeof body.address === 'string' ? body.address.trim() : existing.address
  const postcode =
    typeof body.postcode === 'string' ? body.postcode.trim().toUpperCase() : existing.postcode

  if (!address || !postcode) {
    return NextResponse.json({ error: 'Address and postcode are required' }, { status: 400 })
  }

  const updated = await prisma.customerAddress.update({
    where: { id },
    data: { address, postcode },
  })

  return NextResponse.json({ address: updated })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCustomerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await ownedAddress(id, session.customerId)
  if (!existing) {
    return NextResponse.json({ error: 'Address not found' }, { status: 404 })
  }

  await prisma.customerAddress.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
