import { NextResponse } from 'next/server'
import { getAdminSession } from '@/app/lib/admin-auth'
import prisma from '@/app/lib/prisma'
import {
  EMAIL_TEMPLATE_TYPES,
  type EmailTemplateType,
} from '@/app/lib/email-templates/constants'
import { getBuiltinDefaultTemplate } from '@/app/lib/email-templates/defaults'
import {
  getSampleVariables,
  renderSubject,
  renderTemplate,
} from '@/app/lib/email-renderer'
import { sendRawEmail } from '@/app/lib/email'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string; type: string }> }

function isValidTemplateType(value: string): value is EmailTemplateType {
  return EMAIL_TEMPLATE_TYPES.includes(value as EmailTemplateType)
}

export async function PATCH(request: Request, { params }: Params) {
  const admin = await getAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, type } = await params
  if (!isValidTemplateType(type)) {
    return NextResponse.json({ error: 'Invalid template type' }, { status: 400 })
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: { id, deleted_at: null },
    select: { id: true },
  })

  if (!restaurant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const subject = body.subject as string | undefined
  const htmlBody = body.html_body as string | undefined
  const reset = body.reset === true

  if (reset) {
    await prisma.emailTemplate.deleteMany({
      where: { restaurant_id: id, template_type: type },
    })

    const defaults = getBuiltinDefaultTemplate(type)
    return NextResponse.json({
      template: {
        template_type: type,
        subject: defaults.subject,
        html_body: defaults.html,
        is_custom: false,
      },
    })
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
        template_type: type,
      },
    },
    create: {
      restaurant_id: id,
      template_type: type,
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

  return NextResponse.json({
    template: {
      template_type: template.template_type,
      subject: template.subject,
      html_body: template.html_body,
      is_custom: true,
    },
  })
}

export async function POST(request: Request, { params }: Params) {
  const admin = await getAdminSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, type } = await params
  if (!isValidTemplateType(type)) {
    return NextResponse.json({ error: 'Invalid template type' }, { status: 400 })
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: { id, deleted_at: null },
    select: {
      name: true,
      primary_color: true,
      logo_url: true,
      phone: true,
      email: true,
      address: true,
      postcode: true,
    },
  })

  if (!restaurant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const action = body.action as string

  if (action === 'preview') {
    const subject = body.subject as string
    const htmlBody = body.html_body as string

    if (!subject?.trim() || !htmlBody?.trim()) {
      return NextResponse.json(
        { error: 'Subject and HTML body are required' },
        { status: 400 }
      )
    }

    const variables = getSampleVariables(type, restaurant)
    return NextResponse.json({
      subject: renderSubject(subject, variables),
      html: renderTemplate(htmlBody, variables),
    })
  }

  if (action === 'test') {
    const subject = body.subject as string
    const htmlBody = body.html_body as string

    if (!subject?.trim() || !htmlBody?.trim()) {
      return NextResponse.json(
        { error: 'Subject and HTML body are required' },
        { status: 400 }
      )
    }

    const variables = getSampleVariables(type, restaurant)
    const renderedSubject = renderSubject(subject, variables)
    const renderedHtml = renderTemplate(htmlBody, variables)

    await sendRawEmail(admin.email, renderedSubject, renderedHtml)

    return NextResponse.json({
      sent: true,
      to: admin.email,
      subject: renderedSubject,
      html: renderedHtml,
    })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
