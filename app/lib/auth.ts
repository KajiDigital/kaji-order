import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import prisma from './prisma'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret'
export const SESSION_COOKIE = 'kaji_order_session'
const SESSION_EXPIRY = '7d'

export type SessionPayload = {
  staffId: string
  restaurantId: string
  email: string
  role: string
}

export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: SESSION_EXPIRY })
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload
  } catch {
    return null
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  const staff = await prisma.restaurantStaff.findUnique({
    where: { id: payload.staffId },
    include: {
      restaurant: {
        select: {
          id: true,
          slug: true,
          name: true,
          logo_url: true,
          brand_color: true,
        },
      },
    },
  })

  if (!staff) return null

  return {
    staffId: staff.id,
    restaurantId: staff.restaurant_id,
    email: staff.email,
    role: staff.role,
    name: staff.name,
    restaurant: staff.restaurant,
  }
}
