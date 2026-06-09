export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getSession } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'
import { getOpenStatus } from '@/app/lib/opening-hours'
import { formatPence, formatOrderNumber, getOrderUrl } from '@/app/lib/utils'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.restaurantId },
    include: {
      menu_categories: { take: 1 },
      orders: {
        where: { created_at: { gte: today } },
        orderBy: { created_at: 'desc' },
        take: 5,
        include: { items: true },
      },
    },
  })

  if (!restaurant) return null

  const todayOrders = await prisma.onlineOrder.findMany({
    where: { restaurant_id: session.restaurantId, created_at: { gte: today } },
  })

  const ordersCount = todayOrders.length
  const revenue = todayOrders.reduce((s, o) => s + o.total_pence, 0)
  const avgOrderValue = ordersCount > 0 ? revenue / ordersCount : 0

  const openStatus = getOpenStatus(
    restaurant.opening_hours,
    restaurant.holiday_mode,
    restaurant.accept_preorders,
    restaurant.show_menu_when_closed,
    restaurant.collection_enabled,
    restaurant.preorder_days_ahead,
    restaurant.holiday_message
  )
  let statusLabel = 'Open'
  let statusColor = 'bg-emerald-500/20 text-emerald-400'
  if (restaurant.holiday_mode) {
    statusLabel = 'Holiday mode'
    statusColor = 'bg-amber-500/20 text-amber-400'
  } else if (openStatus.isPreorderMode) {
    statusLabel = 'Pre-orders open'
    statusColor = 'bg-amber-500/20 text-amber-400'
  } else if (!openStatus.isOpen) {
    statusLabel = 'Closed'
    statusColor = 'bg-slate-500/20 text-slate-400'
  }

  const hasMenu = restaurant.menu_categories.length > 0
  const hasHours = Boolean(restaurant.opening_hours)
  const hasStripe = Boolean(restaurant.stripe_account_id)

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{restaurant.name}</h1>
          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Orders today" value={String(ordersCount)} />
        <StatCard label="Revenue today" value={formatPence(revenue)} />
        <StatCard
          label="Avg order value"
          value={ordersCount > 0 ? formatPence(Math.round(avgOrderValue)) : '£0.00'}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/orders" className="px-4 py-2 bg-violet-600 rounded-lg text-white text-sm">
          View orders
        </Link>
        <Link href="/dashboard/menu" className="px-4 py-2 bg-slate-800 rounded-lg text-white text-sm">
          Edit menu
        </Link>
        <Link href="/dashboard/settings" className="px-4 py-2 bg-slate-800 rounded-lg text-white text-sm">
          Settings
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="font-semibold text-white mb-4">Setup checklist</h2>
        <ul className="space-y-2 text-sm">
          <ChecklistItem done={hasMenu} label="Add your menu" href="/dashboard/menu" />
          <ChecklistItem done={hasHours} label="Set opening hours" href="/dashboard/settings" />
          <ChecklistItem done={hasStripe} label="Connect Stripe" href="/dashboard/billing" />
          <li className="flex items-center gap-2 text-slate-300">
            <span>{hasMenu ? '✓' : '□'}</span>
            Share your link:{' '}
            <a href={getOrderUrl(restaurant.slug)} className="text-violet-400 hover:underline" target="_blank" rel="noreferrer">
              {getOrderUrl(restaurant.slug).replace(/^https?:\/\//, '')}
            </a>
          </li>
        </ul>
      </div>

      <div>
        <h2 className="font-semibold text-white mb-4">Recent orders</h2>
        {restaurant.orders.length === 0 ? (
          <p className="text-slate-400 text-sm">No orders yet today.</p>
        ) : (
          <div className="space-y-2">
            {restaurant.orders.map((order) => (
              <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex justify-between">
                <div>
                  <p className="font-medium text-white">{formatOrderNumber(order.order_number)}</p>
                  <p className="text-sm text-slate-400">{order.customer_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-white">{formatPence(order.total_pence)}</p>
                  <p className="text-xs text-slate-500">{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  )
}

function ChecklistItem({
  done,
  label,
  href,
}: {
  done: boolean
  label: string
  href: string
}) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-2 text-slate-300 hover:text-white">
        <span>{done ? '✓' : '□'}</span>
        {label}
      </Link>
    </li>
  )
}
