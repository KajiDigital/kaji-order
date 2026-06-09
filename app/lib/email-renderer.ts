import prisma from './prisma'
import {
  EMAIL_TEMPLATE_TYPES,
  type EmailTemplateType,
} from './email-templates/constants'
import {
  getBuiltinDefaultTemplate,
  getBuiltinDefaultTemplates,
} from './email-templates/defaults'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function renderTemplate(
  html: string,
  variables: Record<string, unknown>
): string {
  const primaryColor = String(variables.primary_color ?? '#c2410c')
  let result = html.replace(/\[PRIMARY_COLOR\]/g, primaryColor)

  const eachRegex = /\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g
  let prev = ''
  while (prev !== result) {
    prev = result
    result = result.replace(eachRegex, (_, key, block) => {
      const arr = variables[key]
      if (!Array.isArray(arr) || arr.length === 0) return ''
      return arr
        .map((item) => {
          const scope =
            typeof item === 'object' && item !== null
              ? { ...variables, ...(item as Record<string, unknown>) }
              : variables
          return renderTemplate(block, scope)
        })
        .join('')
    })
  }

  const ifRegex = /\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g
  prev = ''
  while (prev !== result) {
    prev = result
    result = result.replace(ifRegex, (_, key, block) => {
      const val = variables[key]
      const truthy =
        val !== null && val !== undefined && val !== false && val !== ''
      return truthy ? renderTemplate(block, variables) : ''
    })
  }

  result = result.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = variables[key]
    if (val === null || val === undefined) return ''
    return escapeHtml(String(val))
  })

  return result
}

export function renderSubject(
  subject: string,
  variables: Record<string, unknown>
): string {
  return renderTemplate(subject, variables).replace(/<[^>]*>/g, '')
}

async function fetchTemplateFromDb(
  restaurantId: string | null,
  templateType: EmailTemplateType
) {
  return prisma.emailTemplate.findFirst({
    where: {
      restaurant_id: restaurantId,
      template_type: templateType,
      is_active: true,
    },
  })
}

export async function getTemplate(
  restaurantId: string,
  templateType: EmailTemplateType
): Promise<{ subject: string; html: string; isCustom: boolean }> {
  const custom = await fetchTemplateFromDb(restaurantId, templateType)
  if (custom) {
    return {
      subject: custom.subject,
      html: custom.html_body,
      isCustom: true,
    }
  }

  const global = await fetchTemplateFromDb(null, templateType)
  if (global) {
    return {
      subject: global.subject,
      html: global.html_body,
      isCustom: false,
    }
  }

  const builtin = getBuiltinDefaultTemplate(templateType)
  return { ...builtin, isCustom: false }
}

export async function getAllTemplatesForRestaurant(restaurantId: string) {
  const customTemplates = await prisma.emailTemplate.findMany({
    where: { restaurant_id: restaurantId },
  })
  const customByType = new Map(
    customTemplates.map((t) => [t.template_type, t])
  )

  return Promise.all(
    EMAIL_TEMPLATE_TYPES.map(async (type) => {
      const custom = customByType.get(type)
      if (custom) {
        return {
          template_type: type,
          subject: custom.subject,
          html_body: custom.html_body,
          is_custom: true,
          is_active: custom.is_active,
        }
      }

      const resolved = await getTemplate(restaurantId, type)
      return {
        template_type: type,
        subject: resolved.subject,
        html_body: resolved.html,
        is_custom: false,
        is_active: true,
      }
    })
  )
}

export async function seedGlobalEmailTemplates() {
  const defaults = getBuiltinDefaultTemplates()

  for (const template of defaults) {
    const existing = await prisma.emailTemplate.findFirst({
      where: { restaurant_id: null, template_type: template.template_type },
    })

    if (existing) {
      await prisma.emailTemplate.update({
        where: { id: existing.id },
        data: {
          subject: template.subject,
          html_body: template.html_body,
          is_active: true,
        },
      })
    } else {
      await prisma.emailTemplate.create({
        data: {
          restaurant_id: null,
          template_type: template.template_type,
          subject: template.subject,
          html_body: template.html_body,
          is_active: true,
        },
      })
    }
  }
}

export function getSampleVariables(
  templateType: EmailTemplateType,
  restaurant?: {
    name?: string
    primary_color?: string | null
    logo_url?: string | null
    phone?: string | null
    email?: string | null
    address?: string | null
    postcode?: string | null
  }
): Record<string, unknown> {
  const primaryColor = restaurant?.primary_color ?? '#c2410c'
  const restaurantName = restaurant?.name ?? 'Sample Restaurant'
  const address = [restaurant?.address, restaurant?.postcode]
    .filter(Boolean)
    .join(', ')

  const sampleItems = [
    { name: 'Chicken Burrito', quantity: 2, price: '9.50' },
    { name: 'Guacamole', quantity: 1, price: '2.50' },
  ]

  const base = {
    order_number: '#OL-0042',
    order_date: '9 June 2026, 18:30',
    restaurant_name: restaurantName,
    logo_url: restaurant?.logo_url ?? '',
    primary_color: primaryColor,
    customer_name: 'Jane Smith',
    customer_email: 'jane@example.com',
    customer_phone: '07700 900123',
    prep_time: '25',
    order_type: 'Collection',
    order_type_message: 'We will notify you when your order is ready to collect.',
    items: sampleItems,
    subtotal: '21.50',
    service_fee: '0.49',
    total: '21.99',
    notes: 'No onions please',
    restaurant_phone: restaurant?.phone ?? '020 7946 0958',
    restaurant_email: restaurant?.email ?? 'hello@restaurant.com',
    restaurant_address: address || '123 High Street, London',
    year: String(new Date().getFullYear()),
    show_powered_by: true,
    dashboard_url: 'https://order.kajipos.co.uk/dashboard/orders',
    accept_url: 'https://order.kajipos.co.uk/dashboard/orders',
    reject_url: 'https://order.kajipos.co.uk/dashboard/orders',
    time_received: '9 June 2026, 18:30',
    amount: '21.99',
  }

  if (templateType === 'new_order_alert') {
    return base
  }
  if (templateType === 'refund_confirmation') {
    return {
      order_number: base.order_number,
      customer_name: base.customer_name,
      restaurant_name: base.restaurant_name,
      amount: base.total,
      primary_color: primaryColor,
      year: base.year,
    }
  }
  return base
}
