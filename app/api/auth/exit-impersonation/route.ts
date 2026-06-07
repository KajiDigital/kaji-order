import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { setAdminCookie } from '@/app/lib/admin-auth'
import { SESSION_COOKIE } from '@/app/lib/auth'
import {
  ADMIN_BACKUP_COOKIE,
  IMPERSONATING_COOKIE,
  getImpersonationInfo,
  clearCookie,
} from '@/app/lib/impersonation'

export const dynamic = 'force-dynamic'

export async function POST() {
  const impersonating = await getImpersonationInfo()
  const cookieStore = await cookies()
  const adminBackup = cookieStore.get(ADMIN_BACKUP_COOKIE)?.value

  if (!impersonating || !adminBackup) {
    return NextResponse.json({ error: 'Not impersonating' }, { status: 400 })
  }

  const response = NextResponse.json({
    success: true,
    redirect: `/admin/restaurants/${impersonating.restaurantId}`,
  })

  response.cookies.set(setAdminCookie(adminBackup))
  response.cookies.set(clearCookie(SESSION_COOKIE))
  response.cookies.set(clearCookie(ADMIN_BACKUP_COOKIE))
  response.cookies.set(clearCookie(IMPERSONATING_COOKIE))

  return response
}
