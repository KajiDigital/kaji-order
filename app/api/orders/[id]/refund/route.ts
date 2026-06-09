import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import { processOrderRefund } from '@/app/lib/refund-order'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const { reason, amount_pence } = body as { reason?: string; amount_pence?: number }

  const result = await processOrderRefund({
    orderId: id,
    restaurantId: session.restaurantId,
    reason: reason ?? '',
    amountPence: amount_pence,
    allowPartial: false,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({
    success: true,
    refund_type: result.refund_type,
    amount_pence: result.amount_pence,
  })
}
