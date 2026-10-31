import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { getCustomerSession } from '@/app/lib/customer-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function noStore(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get('slug')
  const session = await getCustomerSession()
  if (!session || (slug && session.slug !== slug)) {
    return noStore({ customer: null })
  }

  return noStore({
    customer: {
      id: session.customerId,
      name: session.name,
      email: session.email,
      phone: session.phone,
      addresses: session.addresses.map((a) => ({
        id: a.id,
        address: a.address,
        postcode: a.postcode,
      })),
    },
  })
}

export async function PATCH(request: Request) {
  const session = await getCustomerSession()
  if (!session) return noStore({ error: 'Unauthorized' }, 401)

  const body = await request.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''

  if (!name) return noStore({ error: 'Name is required' }, 400)

  const customer = await prisma.customer.update({
    where: { id: session.customerId },
    data: { name, phone: phone || null },
  })

  return noStore({
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    },
  })
}
