import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { verifyPassword } from '@/app/lib/auth'
import {
  signAdminToken,
  setAdminCookie,
  ADMIN_SESSION_COOKIE,
} from '@/app/lib/admin-auth'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    const admin = await prisma.adminUser.findUnique({ where: { email } })
    if (!admin || !(await verifyPassword(password, admin.password))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = signAdminToken({
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
    })

    const response = NextResponse.json({ success: true })
    response.cookies.set(setAdminCookie(token))
    return response
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(ADMIN_SESSION_COOKIE, '', { httpOnly: true, maxAge: 0, path: '/' })
  return response
}
