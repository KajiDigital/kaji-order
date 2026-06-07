import { NextResponse } from 'next/server'
import { getPlatformSettings } from '@/app/lib/platform'

export const dynamic = 'force-dynamic'

export async function GET() {
  const settings = await getPlatformSettings()
  return NextResponse.json({
    registration_mode: settings.registration_mode,
  })
}
