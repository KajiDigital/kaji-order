import { NextResponse } from 'next/server'
import { processExpiredOrders } from '@/app/lib/order-expiry'

export const dynamic = 'force-dynamic'

export async function GET() {
  const count = await processExpiredOrders()
  return NextResponse.json({ processed: count })
}
