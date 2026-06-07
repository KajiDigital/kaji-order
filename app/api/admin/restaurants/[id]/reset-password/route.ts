import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getAdminSession } from '@/app/lib/admin-auth'
import { hashPassword } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'
import { logAdminChange } from '@/app/lib/audit'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const fromEmail = process.env.FROM_EMAIL ?? 'orders@mail.kajipos.co.uk'

type Params = { params: Promise<{ id: string }> }

export async function POST(_request: Request, { params }: Params) {
  const admin = await getAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const restaurant = await prisma.restaurant.findFirst({
    where: { id, deleted_at: null },
    include: { staff: { take: 1, orderBy: { created_at: 'asc' } } },
  })

  const staff = restaurant?.staff[0]
  if (!restaurant || !staff?.email) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const tempPassword = randomBytes(8).toString('base64url')
  await prisma.restaurantStaff.update({
    where: { id: staff.id },
    data: { password: await hashPassword(tempPassword), password_set: false },
  })

  const subject = `Password reset — ${restaurant.name}`
  const html = `
    <h2>Password reset</h2>
    <p>Your password for <strong>${restaurant.name}</strong> has been reset.</p>
    <p>Temporary password: <strong>${tempPassword}</strong></p>
    <p>Sign in at ${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002'}/login</p>
  `

  if (resend) {
    await resend.emails.send({ from: fromEmail, to: staff.email, subject, html })
  } else {
    console.log('[email] reset password (no RESEND_API_KEY):', { to: staff.email, tempPassword })
  }

  logAdminChange(admin.email, id, { action: 'reset_password' })
  return NextResponse.json({ success: true })
}
