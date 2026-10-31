import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getAdminSession } from '@/app/lib/admin-auth'
import { hashPassword } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'
import { logAdminChange } from '@/app/lib/audit'
import {
  buildInviteEmailDraft,
  emailHtmlFromText,
  sendRawEmail,
} from '@/app/lib/email'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

async function loadRestaurant(id: string) {
  return prisma.restaurant.findFirst({
    where: { id, deleted_at: null },
    include: { staff: { take: 1, orderBy: { created_at: 'asc' } } },
  })
}

export async function GET(_request: Request, { params }: Params) {
  const admin = await getAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const restaurant = await loadRestaurant(id)
  if (!restaurant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const loginEmail = restaurant.staff[0]?.email ?? restaurant.email
  if (!loginEmail) {
    return NextResponse.json({ error: 'This restaurant has no email address' }, { status: 400 })
  }

  const tempPassword = randomBytes(6).toString('base64url')
  const draft = buildInviteEmailDraft({
    to: loginEmail,
    restaurantName: restaurant.name,
    contactName: restaurant.contact_name,
    tempPassword,
  })

  return NextResponse.json({
    to: loginEmail,
    login_email: loginEmail,
    subject: draft.subject,
    body: draft.body,
    temp_password: tempPassword,
    login_url: draft.loginUrl,
    has_login: Boolean(restaurant.staff[0]),
  })
}

export async function POST(request: Request, { params }: Params) {
  const admin = await getAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const restaurant = await loadRestaurant(id)
  if (!restaurant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const payload = await request.json().catch(() => ({}))
  const to = typeof payload.to === 'string' ? payload.to.trim() : restaurant.email
  const subject = typeof payload.subject === 'string' ? payload.subject.trim() : ''
  const body = typeof payload.body === 'string' ? payload.body.trim() : ''
  const tempPassword =
    typeof payload.temp_password === 'string' && payload.temp_password.trim().length >= 6
      ? payload.temp_password.trim()
      : randomBytes(6).toString('base64url')

  if (!to || !isEmail(to)) {
    return NextResponse.json({ error: 'A valid recipient email is required' }, { status: 400 })
  }
  if (!subject || subject.length > 200) {
    return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
  }
  if (!body || body.length > 10_000) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  let staff = restaurant.staff[0]
  const hashed = await hashPassword(tempPassword)
  const loginEmail = staff?.email ?? restaurant.email ?? to

  if (!staff) {
    staff = await prisma.restaurantStaff.create({
      data: {
        restaurant_id: id,
        email: loginEmail,
        password: hashed,
        name: restaurant.contact_name ?? restaurant.name,
        role: 'OWNER',
        password_set: false,
      },
    })
    await prisma.restaurant.update({
      where: { id },
      data: { status: 'active' },
    })
  } else {
    await prisma.restaurantStaff.update({
      where: { id: staff.id },
      data: { password: hashed, password_set: false },
    })
  }

  await sendRawEmail(to, subject, emailHtmlFromText(body))
  logAdminChange(admin.email, id, { action: 'send_invite', to })

  return NextResponse.json({ success: true, to })
}
