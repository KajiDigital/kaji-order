import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import prisma from './prisma'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret'
export const ADMIN_SESSION_COOKIE = 'kaji_order_admin_session'
const SESSION_EXPIRY = '7d'

export type AdminSessionPayload = {
  adminId: string
  email: string
  role: string
}

export function signAdminToken(payload: AdminSessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: SESSION_EXPIRY })
}

export function verifyAdminToken(token: string): AdminSessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminSessionPayload
  } catch {
    return null
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  if (!token) return null

  const payload = verifyAdminToken(token)
  if (!payload) return null

  const admin = await prisma.adminUser.findUnique({
    where: { id: payload.adminId },
    select: { id: true, email: true, role: true },
  })

  if (!admin) return null
  return admin
}

export function setAdminCookie(token: string) {
  return {
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  }
}
