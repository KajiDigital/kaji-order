import { NextResponse } from 'next/server'
import { getAdminSession } from '@/app/lib/admin-auth'
import { getPlatformSettings } from '@/app/lib/platform'
import prisma from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const settings = await getPlatformSettings()
  return NextResponse.json({ settings })
}

export async function PATCH(request: Request) {
  const admin = await getAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { registration_mode, show_commission, service_fee_pence } = body

  if (
    registration_mode !== undefined &&
    registration_mode !== 'request' &&
    registration_mode !== 'self_serve'
  ) {
    return NextResponse.json({ error: 'Invalid registration_mode' }, { status: 400 })
  }

  if (
    service_fee_pence !== undefined &&
    (typeof service_fee_pence !== 'number' || service_fee_pence < 0 || service_fee_pence > 999)
  ) {
    return NextResponse.json({ error: 'Invalid service_fee_pence' }, { status: 400 })
  }

  const settings = await prisma.platformSettings.upsert({
    where: { id: 'platform' },
    create: {
      id: 'platform',
      registration_mode: registration_mode ?? 'request',
      show_commission: show_commission ?? false,
      service_fee_pence: service_fee_pence ?? 49,
    },
    update: {
      ...(registration_mode !== undefined && { registration_mode }),
      ...(show_commission !== undefined && { show_commission }),
      ...(service_fee_pence !== undefined && { service_fee_pence }),
    },
  })

  return NextResponse.json({ settings })
}
