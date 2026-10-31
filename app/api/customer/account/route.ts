import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { clearCustomerCookie, getCustomerSession } from '@/app/lib/customer-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function DELETE() {
  const session = await getCustomerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const anonymisedEmail = `deleted+${session.customerId}@deleted.local`

  await prisma.$transaction([
    prisma.onlineOrder.updateMany({
      where: { customer_id: session.customerId },
      data: {
        customer_name: 'Deleted customer',
        customer_email: anonymisedEmail,
        customer_phone: null,
      },
    }),
    prisma.customerAddress.deleteMany({ where: { customer_id: session.customerId } }),
    prisma.customer.update({
      where: { id: session.customerId },
      data: {
        name: 'Deleted customer',
        email: anonymisedEmail,
        phone: null,
        deleted_at: new Date(),
      },
    }),
  ])

  const response = NextResponse.json({ success: true })
  response.cookies.set(clearCustomerCookie())
  return response
}
