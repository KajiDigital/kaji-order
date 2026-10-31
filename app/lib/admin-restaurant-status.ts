import { randomBytes } from 'crypto'
import prisma from '@/app/lib/prisma'
import { hashPassword } from '@/app/lib/auth'
import { slugify } from '@/app/lib/utils'
import { sendRegistrationApproved, sendRegistrationRejected } from '@/app/lib/email'
import { ensureDefaultMenuTags } from '@/app/lib/menu-tags'
import { logAdminChange } from '@/app/lib/audit'

export type RestaurantActionResult =
  | { ok: true; id: string; name: string }
  | { ok: false; id: string; name: string; error: string }

async function loadRestaurant(id: string) {
  return prisma.restaurant.findUnique({
    where: { id },
    include: { _count: { select: { staff: true } } },
  })
}

export async function approveRestaurant(
  id: string,
  adminEmail: string
): Promise<RestaurantActionResult> {
  const restaurant = await loadRestaurant(id)
  if (!restaurant || restaurant.deleted_at) {
    return { ok: false, id, name: 'Restaurant', error: 'Not found' }
  }
  if (restaurant.status !== 'pending') {
    return { ok: false, id, name: restaurant.name, error: 'Not pending' }
  }
  if (!restaurant.email || !restaurant.contact_name) {
    return { ok: false, id, name: restaurant.name, error: 'Missing contact email or name' }
  }

  const existingStaff = await prisma.restaurantStaff.findUnique({
    where: { email: restaurant.email },
  })
  if (existingStaff) {
    return { ok: false, id, name: restaurant.name, error: 'Staff account already exists' }
  }

  let slug = slugify(restaurant.name)
  if (slug.length < 2) slug = `restaurant-${randomBytes(3).toString('hex')}`

  const slugTaken = await prisma.restaurant.findFirst({
    where: { slug, id: { not: id } },
  })
  if (slugTaken) {
    slug = `${slug}-${randomBytes(2).toString('hex')}`
  }

  const tempPassword = randomBytes(6).toString('base64url')
  const hashed = await hashPassword(tempPassword)

  await prisma.$transaction([
    prisma.restaurant.update({
      where: { id },
      data: { status: 'active', slug },
    }),
    prisma.restaurantStaff.create({
      data: {
        restaurant_id: id,
        email: restaurant.email,
        password: hashed,
        name: restaurant.contact_name,
        role: 'OWNER',
        password_set: false,
      },
    }),
  ])

  await ensureDefaultMenuTags(id)
  await sendRegistrationApproved(
    restaurant.email,
    restaurant.name,
    tempPassword,
    restaurant.contact_name
  )
  logAdminChange(adminEmail, id, { action: 'approve', status: 'active' })
  return { ok: true, id, name: restaurant.name }
}

export async function rejectRestaurant(
  id: string,
  adminEmail: string
): Promise<RestaurantActionResult> {
  const restaurant = await loadRestaurant(id)
  if (!restaurant || restaurant.deleted_at) {
    return { ok: false, id, name: 'Restaurant', error: 'Not found' }
  }
  if (restaurant.status !== 'pending') {
    return { ok: false, id, name: restaurant.name, error: 'Not pending' }
  }

  await prisma.restaurant.update({
    where: { id },
    data: { status: 'suspended' },
  })

  if (restaurant.email) {
    await sendRegistrationRejected(restaurant.email, restaurant.name)
  }

  logAdminChange(adminEmail, id, { action: 'reject', status: 'suspended' })
  return { ok: true, id, name: restaurant.name }
}

export async function activateRestaurant(
  id: string,
  adminEmail: string
): Promise<RestaurantActionResult> {
  const restaurant = await loadRestaurant(id)
  if (!restaurant || restaurant.deleted_at) {
    return { ok: false, id, name: 'Restaurant', error: 'Not found' }
  }
  if (restaurant.status === 'active') {
    return { ok: false, id, name: restaurant.name, error: 'Already active' }
  }
  if (restaurant.status === 'pending' && restaurant._count.staff === 0) {
    return {
      ok: false,
      id,
      name: restaurant.name,
      error: 'Pending restaurants need Approve',
    }
  }

  await prisma.restaurant.update({
    where: { id },
    data: { status: 'active' },
  })
  logAdminChange(adminEmail, id, { action: 'activate', status: 'active' })
  return { ok: true, id, name: restaurant.name }
}

export async function deactivateRestaurant(
  id: string,
  adminEmail: string
): Promise<RestaurantActionResult> {
  const restaurant = await loadRestaurant(id)
  if (!restaurant || restaurant.deleted_at) {
    return { ok: false, id, name: 'Restaurant', error: 'Not found' }
  }
  if (restaurant.status === 'suspended') {
    return { ok: false, id, name: restaurant.name, error: 'Already deactivated' }
  }

  await prisma.restaurant.update({
    where: { id },
    data: { status: 'suspended' },
  })
  logAdminChange(adminEmail, id, { action: 'deactivate', status: 'suspended' })
  return { ok: true, id, name: restaurant.name }
}
