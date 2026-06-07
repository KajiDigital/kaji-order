import { Resend } from 'resend'
import { formatOrderNumber, formatPence, getAppUrl } from './utils'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const fromEmail = process.env.FROM_EMAIL ?? 'orders@mail.kajipos.co.uk'
const ADMIN_NOTIFY_EMAIL = 'info@kajidigital.com'

type OrderEmailData = {
  orderNumber: number
  restaurantName: string
  customerName: string
  customerEmail: string
  items: { name: string; quantity: number; pricePence: number }[]
  totalPence: number
  estimatedMinutes?: number
  notes?: string | null
}

function buildItemsHtml(items: OrderEmailData['items']): string {
  return items
    .map(
      (i) =>
        `<tr><td>${i.quantity}x ${i.name}</td><td style="text-align:right">${formatPence(i.pricePence * i.quantity)}</td></tr>`
    )
    .join('')
}

export async function sendOrderConfirmation(
  to: string,
  order: OrderEmailData
): Promise<void> {
  const subject = `Order confirmed! ${formatOrderNumber(order.orderNumber)} — ${order.restaurantName}`
  const html = `
    <h2>Order confirmed!</h2>
    <p>Hi ${order.customerName},</p>
    <p>Your order ${formatOrderNumber(order.orderNumber)} at <strong>${order.restaurantName}</strong> has been received.</p>
    <p>Estimated ready time: ~${order.estimatedMinutes ?? 30} minutes</p>
    <table cellpadding="8" style="border-collapse:collapse;width:100%">
      ${buildItemsHtml(order.items)}
      <tr><td><strong>Total</strong></td><td style="text-align:right"><strong>${formatPence(order.totalPence)}</strong></td></tr>
    </table>
    ${order.notes ? `<p><em>Notes: ${order.notes}</em></p>` : ''}
  `

  if (!resend) {
    console.log('[email] sendOrderConfirmation (no RESEND_API_KEY):', { to, subject })
    return
  }

  await resend.emails.send({ from: fromEmail, to, subject, html })
}

export async function sendRestaurantNewOrder(
  restaurantEmail: string,
  order: OrderEmailData & { dashboardUrl?: string }
): Promise<void> {
  const subject = `New order! ${formatOrderNumber(order.orderNumber)} — ${formatPence(order.totalPence)}`
  const html = `
    <h2>New online order</h2>
    <p><strong>${formatOrderNumber(order.orderNumber)}</strong> from ${order.customerName}</p>
    <table cellpadding="8" style="border-collapse:collapse;width:100%">
      ${buildItemsHtml(order.items)}
      <tr><td><strong>Total</strong></td><td style="text-align:right"><strong>${formatPence(order.totalPence)}</strong></td></tr>
    </table>
    ${order.notes ? `<p><em>Notes: ${order.notes}</em></p>` : ''}
    ${order.dashboardUrl ? `<p><a href="${order.dashboardUrl}">View in dashboard</a></p>` : ''}
  `

  if (!resend) {
    console.log('[email] sendRestaurantNewOrder (no RESEND_API_KEY):', { to: restaurantEmail, subject })
    return
  }

  await resend.emails.send({ from: fromEmail, to: restaurantEmail, subject, html })
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
    console.log('[email] sendRegistrationApproved (no RESEND_API_KEY):', { to, subject })
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
