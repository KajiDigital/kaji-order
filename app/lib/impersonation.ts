import { cookies } from 'next/headers'
import { ADMIN_SESSION_COOKIE } from './admin-auth'

export const ADMIN_BACKUP_COOKIE = 'kaji_order_admin_backup'
export const IMPERSONATING_COOKIE = 'kaji_order_impersonating'

export type ImpersonationInfo = {
  restaurantId: string
  restaurantName: string
}

export async function getImpersonationInfo(): Promise<ImpersonationInfo | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(IMPERSONATING_COOKIE)?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as ImpersonationInfo
  } catch {
    return null
  }
}

export function impersonatingCookieOptions(info: ImpersonationInfo) {
  return {
    name: IMPERSONATING_COOKIE,
    value: JSON.stringify(info),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 4,
    path: '/',
  }
}

export function adminBackupCookieOptions(adminToken: string) {
  return {
    name: ADMIN_BACKUP_COOKIE,
    value: adminToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 4,
    path: '/',
  }
}

export function clearCookie(name: string) {
  return { name, value: '', httpOnly: true, maxAge: 0, path: '/' }
}

export { ADMIN_SESSION_COOKIE }
