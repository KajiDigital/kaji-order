import { Resend } from 'resend'
import { formatOrderNumber, formatPence } from './utils'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const fromEmail = process.env.FROM_EMAIL ?? 'orders@mail.kajipos.co.uk'

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
