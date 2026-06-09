import { Resend } from 'resend'
import { formatOrderNumber, getAppUrl, formatReadyAtTime } from './utils'
import { getPrimaryColor, shouldShowPoweredBy } from './branding'
import {
  getTemplate,
  renderSubject,
  renderTemplate,
} from './email-renderer'
import type { EmailTemplateType } from './email-templates/constants'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const fromEmail = process.env.FROM_EMAIL ?? 'orders@mail.kajipos.co.uk'
const ADMIN_NOTIFY_EMAIL = 'info@kajidigital.com'

export type OrderEmailData = {
  orderNumber: number
  restaurantId: string
  restaurantName: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  items: { name: string; quantity: number; pricePence: number }[]
  subtotalPence: number
  serviceFeePence: number
  totalPence: number
  estimatedMinutes?: number
  notes?: string | null
  orderType?: string
  primaryColor?: string
  logoUrl?: string | null
  restaurantPhone?: string | null
  restaurantEmail?: string | null
  restaurantAddress?: string | null
  showPoweredBy?: boolean
  isPreorder?: boolean
  preorderFor?: string | null
  orderDate?: string
  dashboardUrl?: string
  pricingPlan?: string
  readyAt?: string | null
  prepTimeFormatted?: string | null
}

type RefundEmailData = {
  restaurantId: string
  customerName: string
  restaurantName: string
  orderNumber: number
  amountPence: number
  primaryColor?: string
}

type RegistrationRequestData = {
  restaurantName: string
  contactName: string
  email: string
  phone?: string
  restaurantType?: string
  description?: string
  restaurantId: string
}

function formatPencePlain(pence: number): string {
  return (pence / 100).toFixed(2)
}

function formatOrderDate(date?: string): string {
  const value = date ? new Date(date) : new Date()
  return value.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/London',
  })
}

function buildOrderVariables(order: OrderEmailData): Record<string, unknown> {
  const primaryColor = order.primaryColor ?? '#c2410c'
  const orderTypeLabel =
    order.orderType === 'DELIVERY'
      ? 'Delivery'
      : order.orderType === 'COLLECTION'
        ? 'Collection'
        : order.orderType ?? 'Collection'

  let orderTypeMessage = `We will notify you when your order is ready to ${orderTypeLabel === 'Delivery' ? 'deliver' : 'collect'}.`
  if (order.isPreorder && order.preorderFor) {
    orderTypeMessage = `Pre-order scheduled for ${order.preorderFor}. We will prepare it for your chosen time.`
  }

  const dashboardUrl = order.dashboardUrl ?? `${getAppUrl()}/dashboard/orders`

  const readyAtFormatted = order.readyAt
    ? formatReadyAtTime(order.readyAt)
    : ''

  return {
    order_number: formatOrderNumber(order.orderNumber),
    order_date: formatOrderDate(order.orderDate),
    restaurant_name: order.restaurantName,
    logo_url: order.logoUrl ?? '',
    primary_color: primaryColor,
    customer_name: order.customerName,
    customer_email: order.customerEmail,
    customer_phone: order.customerPhone ?? '',
    prep_time: String(order.estimatedMinutes ?? 30),
    ready_at: readyAtFormatted,
    order_type_message: orderTypeMessage,
    order_type: orderTypeLabel,
    items: order.items.map((item) => ({
      name: item.name,
      quantity: String(item.quantity),
      price: formatPencePlain(item.pricePence * item.quantity),
    })),
    subtotal: formatPencePlain(order.subtotalPence),
    service_fee: formatPencePlain(order.serviceFeePence),
    total: formatPencePlain(order.totalPence),
    notes: order.notes ?? '',
    restaurant_phone: order.restaurantPhone ?? '',
    restaurant_email: order.restaurantEmail ?? '',
    restaurant_address: order.restaurantAddress ?? '',
    year: String(new Date().getFullYear()),
    show_powered_by: order.showPoweredBy ?? true,
    dashboard_url: dashboardUrl,
    accept_url: dashboardUrl,
    reject_url: dashboardUrl,
    time_received: formatOrderDate(order.orderDate),
  }
}

async function sendTemplatedEmail(
  to: string,
  restaurantId: string,
  templateType: EmailTemplateType,
  variables: Record<string, unknown>
): Promise<void> {
  const template = await getTemplate(restaurantId, templateType)
  const subject = renderSubject(template.subject, variables)
  const html = renderTemplate(template.html, variables)

  if (!resend) {
    console.log(`[email] ${templateType} (no RESEND_API_KEY):`, { to, subject })
    return
  }

  await resend.emails.send({ from: fromEmail, to, subject, html })
}

export async function sendOrderConfirmation(
  to: string,
  order: OrderEmailData
): Promise<void> {
  await sendTemplatedEmail(
    to,
    order.restaurantId,
    'order_confirmation',
    buildOrderVariables(order)
  )
}

export async function sendRestaurantNewOrder(
  restaurantEmail: string,
  order: OrderEmailData
): Promise<void> {
  await sendTemplatedEmail(
    restaurantEmail,
    order.restaurantId,
    'new_order_alert',
    buildOrderVariables(order)
  )
}

export async function sendRegistrationRequestAdmin(
  data: RegistrationRequestData
): Promise<void> {
  const adminUrl = `${getAppUrl()}/admin/restaurants?tab=pending`
  const subject = `New registration request from ${data.restaurantName}`
  const html = `
    <h2>New registration request</h2>
    <p><strong>${data.restaurantName}</strong></p>
    <p>Contact: ${data.contactName}</p>
    <p>Email: ${data.email}</p>
    ${data.phone ? `<p>Phone: ${data.phone}</p>` : ''}
    ${data.restaurantType ? `<p>Type: ${data.restaurantType}</p>` : ''}
    ${data.description ? `<p>Description: ${data.description}</p>` : ''}
    <p><a href="${adminUrl}">Review in admin</a></p>
  `

  if (!resend) {
    console.log('[email] sendRegistrationRequestAdmin (no RESEND_API_KEY):', { to: ADMIN_NOTIFY_EMAIL, subject })
    return
  }

  await resend.emails.send({ from: fromEmail, to: ADMIN_NOTIFY_EMAIL, subject, html })
}

export async function sendRegistrationRequestConfirmation(
  to: string,
  restaurantName: string
): Promise<void> {
  const subject = `Registration request received — ${restaurantName}`
  const html = `
    <h2>Thank you for your interest!</h2>
    <p>Hi,</p>
    <p>We&apos;ve received your registration request for <strong>${restaurantName}</strong>.</p>
    <p>Our team will review your application and be in touch within 24 hours.</p>
  `

  if (!resend) {
    console.log('[email] sendRegistrationRequestConfirmation (no RESEND_API_KEY):', { to, subject })
    return
  }

  await resend.emails.send({ from: fromEmail, to, subject, html })
}

export async function sendRegistrationApproved(
  to: string,
  restaurantName: string,
  tempPassword: string
): Promise<void> {
  const loginUrl = `${getAppUrl()}/login`
  const subject = `Welcome to Kaji Order — ${restaurantName}`
  const html = `
    <h2>Your account has been approved!</h2>
    <p>Hi,</p>
    <p>Great news — <strong>${restaurantName}</strong> has been approved on Kaji Order.</p>
    <p>Sign in at <a href="${loginUrl}">${loginUrl}</a></p>
    <p>Email: ${to}<br/>Temporary password: <strong>${tempPassword}</strong></p>
    <p>Please change your password after signing in.</p>
  `

  if (!resend) {
    console.log('[email] sendRegistrationApproved (no RESEND_API_KEY):', {
      to,
      subject,
      tempPassword,
      loginUrl,
    })
    return
  }

  await resend.emails.send({ from: fromEmail, to, subject, html })
}

export async function sendRegistrationRejected(
  to: string,
  restaurantName: string
): Promise<void> {
  const subject = `Registration update — ${restaurantName}`
  const html = `
    <h2>Registration update</h2>
    <p>Hi,</p>
    <p>Thank you for your interest in Kaji Order for <strong>${restaurantName}</strong>.</p>
    <p>Unfortunately we&apos;re unable to approve your registration at this time.</p>
    <p>If you have questions, please contact us at ${ADMIN_NOTIFY_EMAIL}.</p>
  `

  if (!resend) {
    console.log('[email] sendRegistrationRejected (no RESEND_API_KEY):', { to, subject })
    return
  }

  await resend.emails.send({ from: fromEmail, to, subject, html })
}

type CancellationEmailData = {
  customerName: string
  restaurantName: string
  orderNumber: number
  reason?: string
}

export async function sendOrderCancellation(
  to: string,
  data: CancellationEmailData
): Promise<void> {
  const subject = `Order not accepted — ${formatOrderNumber(data.orderNumber)}`
  const html = `
    <h2>Order not accepted</h2>
    <p>Hi ${data.customerName},</p>
    <p>Unfortunately <strong>${data.restaurantName}</strong> was unable to accept your order ${formatOrderNumber(data.orderNumber)}.</p>
    <p>You have not been charged. If a payment was authorised, it will be released automatically.</p>
    ${data.reason ? `<p><em>Reason: ${data.reason}</em></p>` : ''}
  `

  if (!resend) {
    console.log('[email] sendOrderCancellation (no RESEND_API_KEY):', { to, subject })
    return
  }

  await resend.emails.send({ from: fromEmail, to, subject, html })
}

export async function sendRefundConfirmation(
  to: string,
  data: RefundEmailData
): Promise<void> {
  const variables = {
    order_number: formatOrderNumber(data.orderNumber),
    customer_name: data.customerName,
    restaurant_name: data.restaurantName,
    amount: formatPencePlain(data.amountPence),
    primary_color: data.primaryColor ?? '#c2410c',
    year: String(new Date().getFullYear()),
  }

  await sendTemplatedEmail(
    to,
    data.restaurantId,
    'refund_confirmation',
    variables
  )
}

export function buildOrderEmailFromDb(
  order: {
    order_number: number
    customer_name: string
    customer_email: string
    customer_phone?: string | null
    notes?: string | null
    subtotal_pence: number
    service_fee_pence: number
    total_pence: number
    order_type: string
    is_preorder: boolean
    preorder_for: Date | null
    created_at: Date
    ready_at?: Date | null
    prep_time_mins?: number | null
    estimated_time?: string | null
    items: { name: string; quantity: number; price_pence: number }[]
    restaurant: {
      id: string
      name: string
      email?: string | null
      phone?: string | null
      address?: string | null
      postcode?: string | null
      logo_url?: string | null
      primary_color?: string | null
      brand_color?: string | null
      show_powered_by?: boolean
      pricing_plan?: string
      avg_prep_minutes: number
    }
  },
  dashboardUrl?: string
): OrderEmailData {
  const restaurant = order.restaurant
  const address = [restaurant.address, restaurant.postcode]
    .filter(Boolean)
    .join(', ')

  let preorderFor: string | null = null
  if (order.is_preorder && order.preorder_for) {
    preorderFor = order.preorder_for.toLocaleString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/London',
    })
  }

  return {
    orderNumber: order.order_number,
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    items: order.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      pricePence: i.price_pence,
    })),
    subtotalPence: order.subtotal_pence,
    serviceFeePence: order.service_fee_pence,
    totalPence: order.total_pence,
    estimatedMinutes: order.prep_time_mins ?? restaurant.avg_prep_minutes,
    notes: order.notes,
    orderType: order.order_type,
    primaryColor: getPrimaryColor(restaurant),
    logoUrl: restaurant.logo_url,
    restaurantPhone: restaurant.phone,
    restaurantEmail: restaurant.email,
    restaurantAddress: address,
    showPoweredBy: shouldShowPoweredBy(restaurant),
    isPreorder: order.is_preorder,
    preorderFor,
    orderDate: order.created_at.toISOString(),
    dashboardUrl,
    pricingPlan: restaurant.pricing_plan,
    readyAt: order.ready_at?.toISOString() ?? null,
    prepTimeFormatted: order.estimated_time ?? null,
  }
}

export async function sendRawEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  if (!resend) {
    console.log('[email] sendRawEmail (no RESEND_API_KEY):', { to, subject })
    return
  }

  await resend.emails.send({ from: fromEmail, to, subject, html })
}

export { sendTemplatedEmail, renderTemplate, renderSubject, getTemplate }
