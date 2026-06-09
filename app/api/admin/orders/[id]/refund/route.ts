import { NextResponse } from 'next/server'
import { getAdminSession } from '@/app/lib/admin-auth'
import { processOrderRefund } from '@/app/lib/refund-order'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const admin = await getAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const { reason, amount_pence } = body as { reason?: string; amount_pence?: number }

  const result = await processOrderRefund({
    orderId: id,
    reason: reason ?? '',
    amountPence: amount_pence,
    allowPartial: true,
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
