import { NextResponse } from 'next/server'
import { getAdminSession } from '@/app/lib/admin-auth'
import prisma from '@/app/lib/prisma'
import {
  EMAIL_TEMPLATE_TYPES,
  type EmailTemplateType,
} from '@/app/lib/email-templates/constants'
import { getAllTemplatesForRestaurant } from '@/app/lib/email-renderer'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

function isValidTemplateType(value: string): value is EmailTemplateType {
  return EMAIL_TEMPLATE_TYPES.includes(value as EmailTemplateType)
}

export async function GET(_request: Request, { params }: Params) {
  const admin = await getAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const restaurant = await prisma.restaurant.findFirst({
    where: { id, deleted_at: null },
    select: { id: true, name: true },
  })

  if (!restaurant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const templates = await getAllTemplatesForRestaurant(id)

  return NextResponse.json({ restaurant, templates })
}

export async function POST(request: Request, { params }: Params) {
  const admin = await getAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const restaurant = await prisma.restaurant.findFirst({
    where: { id, deleted_at: null },
    select: { id: true },
  })

  if (!restaurant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const templateType = body.template_type as string
  const subject = body.subject as string
  const htmlBody = body.html_body as string

  if (!isValidTemplateType(templateType)) {
    return NextResponse.json({ error: 'Invalid template type' }, { status: 400 })
  }

  if (!subject?.trim() || !htmlBody?.trim()) {
    return NextResponse.json(
      { error: 'Subject and HTML body are required' },
      { status: 400 }
    )
  }

  const template = await prisma.emailTemplate.upsert({
    where: {
      restaurant_id_template_type: {
        restaurant_id: id,
        template_type: templateType,
      },
    },
    create: {
      restaurant_id: id,
      template_type: templateType,
      subject: subject.trim(),
      html_body: htmlBody,
      is_active: true,
    },
    update: {
      subject: subject.trim(),
      html_body: htmlBody,
      is_active: true,
    },
  })

  return NextResponse.json({ template })
}
