import { NextResponse } from 'next/server'
import { clearCustomerCookie } from '@/app/lib/customer-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(clearCustomerCookie())
  return response
}
