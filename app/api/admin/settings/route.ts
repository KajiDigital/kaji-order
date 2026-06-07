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
  const { registration_mode, show_commission } = body

  if (
    registration_mode !== undefined &&
    registration_mode !== 'request' &&
    registration_mode !== 'self_serve'
  ) {
    return NextResponse.json({ error: 'Invalid registration_mode' }, { status: 400 })
  }

  const settings = await prisma.platformSettings.upsert({
    where: { id: 'platform' },
    create: {
      id: 'platform',
      registration_mode: registration_mode ?? 'request',
      show_commission: show_commission ?? false,
    },
    update: {
      ...(registration_mode !== undefined && { registration_mode }),
      ...(show_commission !== undefined && { show_commission }),
    },
  })

  return NextResponse.json({ settings })
}
