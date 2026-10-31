import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import prisma from './prisma'
import { hashPassword, verifyPassword } from './auth'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret'
export const CUSTOMER_SESSION_COOKIE = 'kaji_order_customer_session'
const SESSION_EXPIRY = '30d'

export type CustomerSessionPayload = {
  customerId: string
  restaurantId: string
  email: string
  slug: string
}

export function signCustomerToken(payload: CustomerSessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: SESSION_EXPIRY })
}

export function verifyCustomerToken(token: string): CustomerSessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as CustomerSessionPayload
  } catch {
    return null
  }
}

export function customerSessionCookieOptions(token: string) {
  return {
    name: CUSTOMER_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  }
}

export function clearCustomerCookie() {
  return {
    name: CUSTOMER_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
  }
}

export async function getCustomerSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value
  if (!token) return null

  const payload = verifyCustomerToken(token)
  if (!payload) return null

  const customer = await prisma.customer.findFirst({
    where: { id: payload.customerId, deleted_at: null },
    include: {
      restaurant: {
        select: { id: true, slug: true, name: true, status: true, deleted_at: true },
      },
      addresses: { orderBy: { created_at: 'desc' }, take: 3 },
    },
  })

  if (!customer || customer.restaurant.deleted_at || customer.restaurant.status !== 'active') {
    return null
  }

  return {
    customerId: customer.id,
    restaurantId: customer.restaurant_id,
    email: customer.email,
    name: customer.name,
    phone: customer.phone,
    slug: customer.restaurant.slug,
    restaurantName: customer.restaurant.name,
    addresses: customer.addresses,
  }
}

export async function findActiveRestaurantBySlug(slug: string) {
  return prisma.restaurant.findFirst({
    where: { slug, deleted_at: null, status: 'active' },
    select: {
      id: true,
      slug: true,
      name: true,
      primary_color: true,
      brand_color: true,
      logo_url: true,
    },
  })
}

export { hashPassword, verifyPassword }

export function customerOrdersWhere(restaurantId: string, customerId: string, email: string) {
  return {
    restaurant_id: restaurantId,
    OR: [{ customer_id: customerId }, { customer_id: null, customer_email: email }],
  }
}

export async function linkGuestOrdersToCustomer(
  restaurantId: string,
  customerId: string,
  email: string
) {
  await prisma.onlineOrder.updateMany({
    where: {
      restaurant_id: restaurantId,
      customer_id: null,
      customer_email: email,
    },
    data: { customer_id: customerId },
  })
}

export async function upsertCustomerAddress(
  customerId: string,
  address: string,
  postcode: string
) {
  const line = address.trim()
  const code = postcode.trim().toUpperCase()
  if (!line || !code) return

  const existing = await prisma.customerAddress.findFirst({
    where: { customer_id: customerId, address: line, postcode: code },
  })
  if (existing) return

  const count = await prisma.customerAddress.count({ where: { customer_id: customerId } })
  if (count >= 3) {
    const oldest = await prisma.customerAddress.findFirst({
      where: { customer_id: customerId },
      orderBy: { created_at: 'asc' },
    })
    if (oldest) {
      await prisma.customerAddress.delete({ where: { id: oldest.id } })
    }
  }

  await prisma.customerAddress.create({
    data: { customer_id: customerId, address: line, postcode: code },
  })
}
