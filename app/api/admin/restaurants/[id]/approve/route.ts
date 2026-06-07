import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getAdminSession } from '@/app/lib/admin-auth'
import { hashPassword } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'
import { slugify } from '@/app/lib/utils'
import { sendRegistrationApproved } from '@/app/lib/email'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function POST(_request: Request, { params }: Params) {
  const admin = await getAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const restaurant = await prisma.restaurant.findUnique({ where: { id } })

  if (!restaurant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (restaurant.status !== 'pending') {
    return NextResponse.json({ error: 'Restaurant is not pending' }, { status: 400 })
  }

  if (!restaurant.email || !restaurant.contact_name) {
    return NextResponse.json({ error: 'Missing contact email or name' }, { status: 400 })
  }

  const existingStaff = await prisma.restaurantStaff.findUnique({
    where: { email: restaurant.email },
  })
  if (existingStaff) {
    return NextResponse.json({ error: 'Staff account already exists' }, { status: 409 })
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

  await sendRegistrationApproved(restaurant.email, restaurant.name, tempPassword)

  return NextResponse.json({ success: true })
}
