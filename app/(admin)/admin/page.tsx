export const dynamic = 'force-dynamic'

import Link from 'next/link'
import prisma from '@/app/lib/prisma'
import { formatOrderNumber, formatPence } from '@/app/lib/utils'
import { londonDateParts, londonMonthStart, shiftLondonYmd, startOfLondonDay } from '@/app/lib/london-time'
import { CLOSED_ORDER_STATUSES, isLiveOrder } from '@/app/lib/orders'
import { formatLondonWhen, plural, vsYesterday } from '@/app/lib/admin-format'
import { AdminStat } from '@/app/components/admin/AdminStat'

export default async function AdminPage() {
  const parts = londonDateParts()
  const startToday = startOfLondonDay(parts.ymd)
  const startYesterday = startOfLondonDay(shiftLondonYmd(parts.ymd, -1))
  const startMonth = londonMonthStart(parts)

  const [
    restaurantGroups,
    pendingRestaurants,
    stripeIssues,
    holidayRestaurants,
    customerTotal,
    customersToday,
    todayOrders,
    yesterdayOrders,
    monthStats,
    waitingOrders,
    newestCustomers,
    stripeIssueCount,
    waitingCount,
  ] = await Promise.all([
    prisma.restaurant.groupBy({
      by: ['status'],
      where: { deleted_at: null },
      _count: { _all: true },
    }),
    prisma.restaurant.findMany({
      where: { deleted_at: null, status: 'pending' },
      orderBy: { created_at: 'desc' },
      take: 6,
      select: { id: true, name: true, email: true, created_at: true },
    }),
    prisma.restaurant.findMany({
      where: {
        deleted_at: null,
        status: 'active',
        OR: [{ stripe_account_id: null }, { stripe_charges_enabled: false }],
      },
      orderBy: { name: 'asc' },
      take: 6,
      select: { id: true, name: true, stripe_account_id: true, stripe_charges_enabled: true },
    }),
    prisma.restaurant.findMany({
      where: { deleted_at: null, status: 'active', holiday_mode: true },
      select: { id: true, name: true },
      take: 6,
    }),
    prisma.customer.count({ where: { deleted_at: null } }),
    prisma.customer.count({ where: { deleted_at: null, created_at: { gte: startToday } } }),
    prisma.onlineOrder.findMany({
      where: { created_at: { gte: startToday } },
      include: { restaurant: { select: { id: true, name: true, slug: true } } },
      orderBy: { created_at: 'desc' },
    }),
    prisma.onlineOrder.findMany({
      where: { created_at: { gte: startYesterday, lt: startToday } },
      select: { status: true, total_pence: true, commission_pence: true, service_fee_pence: true },
    }),
    prisma.onlineOrder.aggregate({
      where: {
        created_at: { gte: startMonth },
        status: { notIn: CLOSED_ORDER_STATUSES },
      },
      _count: { _all: true },
      _sum: {
        total_pence: true,
        commission_pence: true,
        service_fee_pence: true,
      },
    }),
    prisma.onlineOrder.findMany({
      where: { status: 'PENDING' },
      orderBy: { created_at: 'asc' },
      take: 8,
      include: { restaurant: { select: { id: true, name: true } } },
    }),
    prisma.customer.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true,
        restaurant: { select: { name: true } },
        _count: { select: { orders: true } },
      },
    }),
    prisma.restaurant.count({
      where: {
        deleted_at: null,
        status: 'active',
        OR: [{ stripe_account_id: null }, { stripe_charges_enabled: false }],
      },
    }),
    prisma.onlineOrder.count({ where: { status: 'PENDING' } }),
  ])

  const restaurantCount = (status: string) =>
    restaurantGroups.find((group) => group.status === status)?._count._all ?? 0
  const activeRestaurants = restaurantCount('active')
  const pendingCount = restaurantCount('pending')
  const suspendedCount = restaurantCount('suspended')
  const restaurantTotal = restaurantGroups.reduce((sum, group) => sum + group._count._all, 0)

  const liveToday = todayOrders.filter((order) => isLiveOrder(order.status))
  const yesterdayLive = yesterdayOrders.filter((order) => isLiveOrder(order.status))
  const refundedToday = todayOrders.filter((order) => order.status === 'REFUNDED').length
  const cancelledToday = todayOrders.filter(
    (order) => order.status === 'CANCELLED' || order.status === 'REJECTED'
  ).length

  const gmvToday = liveToday.reduce((sum, order) => sum + order.total_pence, 0)
  const commissionToday = liveToday.reduce((sum, order) => sum + order.commission_pence, 0)
  const serviceFeesToday = liveToday.reduce((sum, order) => sum + order.service_fee_pence, 0)
  const platformToday = commissionToday + serviceFeesToday
  const aovToday = liveToday.length ? Math.round(gmvToday / liveToday.length) : 0
  const gmvYesterday = yesterdayLive.reduce((sum, order) => sum + order.total_pence, 0)
  const platformYesterday = yesterdayLive.reduce(
    (sum, order) => sum + order.commission_pence + order.service_fee_pence,
    0
  )

  const monthPlatform =
    (monthStats._sum.commission_pence ?? 0) + (monthStats._sum.service_fee_pence ?? 0)
  const restaurantsTradingToday = new Set(liveToday.map((order) => order.restaurant_id)).size

  const byRestaurant = new Map<
    string,
    { id: string; name: string; slug: string; orders: number; gmv: number; platform: number }
  >()
  for (const order of liveToday) {
    const current = byRestaurant.get(order.restaurant_id) ?? {
      id: order.restaurant.id,
      name: order.restaurant.name,
      slug: order.restaurant.slug,
      orders: 0,
      gmv: 0,
      platform: 0,
    }
    current.orders += 1
    current.gmv += order.total_pence
    current.platform += order.commission_pence + order.service_fee_pence
    byRestaurant.set(order.restaurant_id, current)
  }
  const topRestaurants = Array.from(byRestaurant.values()).sort((a, b) => b.gmv - a.gmv)

  const attentionCount =
    pendingCount + stripeIssueCount + holidayRestaurants.length + waitingCount

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          {startToday.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'Europe/London',
          })}
          {' · '}Europe/London
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStat
          label="Orders today"
          value={String(liveToday.length)}
          hint={vsYesterday(liveToday.length, yesterdayLive.length)}
        />
        <AdminStat
          label="Food sales today"
          value={formatPence(gmvToday)}
          hint={vsYesterday(gmvToday, gmvYesterday, true)}
        />
        <AdminStat
          label="Avg order today"
          value={formatPence(aovToday)}
          hint={`${plural(restaurantsTradingToday, 'restaurant')} trading`}
        />
        <AdminStat
          label="Platform today"
          value={formatPence(platformToday)}
          hint={`${formatPence(commissionToday)} commission + ${formatPence(serviceFeesToday)} fees`}
        />
        <AdminStat
          label="Platform this month"
          value={formatPence(monthPlatform)}
          hint={`${monthStats._count._all} orders · ${formatPence(monthStats._sum.total_pence ?? 0)} sales`}
          href="/admin/reports"
        />
        <AdminStat
          label="Customers"
          value={String(customerTotal)}
          hint={customersToday ? `+${customersToday} new today` : 'No new accounts today'}
          href="/admin/customers"
        />
        <AdminStat
          label="Restaurants"
          value={String(restaurantTotal)}
          hint={`${activeRestaurants} active · ${pendingCount} pending · ${suspendedCount} off`}
          href="/admin/restaurants"
        />
        <AdminStat
          label="Needs attention"
          value={String(attentionCount)}
          hint={`${waitingCount} waiting · ${pendingCount} to approve · ${stripeIssueCount} Stripe`}
        />
      </div>

      {(refundedToday > 0 || cancelledToday > 0) && (
        <p className="text-sm text-slate-400">
          Today also had {cancelledToday} cancelled/rejected and {refundedToday} refunded
          {yesterdayLive.length ? ` · yesterday ${formatPence(platformYesterday)} platform` : ''}.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <AttentionCard
          title="Waiting for accept"
          empty="No orders waiting."
          href="/admin/restaurants"
          items={waitingOrders.map((order) => ({
            id: order.id,
            href: `/admin/restaurants/${order.restaurant.id}`,
            title: `${order.restaurant.name} ${formatOrderNumber(order.order_number)}`,
            detail: `${order.customer_name} · ${formatPence(order.total_pence)} · ${formatLondonWhen(order.created_at)}`,
          }))}
        />
        <AttentionCard
          title="Pending restaurants"
          empty="No registration requests."
          href="/admin/restaurants"
          items={pendingRestaurants.map((restaurant) => ({
            id: restaurant.id,
            href: `/admin/restaurants/${restaurant.id}`,
            title: restaurant.name,
            detail: `${restaurant.email ?? 'No email'} · ${formatLondonWhen(restaurant.created_at)}`,
          }))}
        />
        <AttentionCard
          title="Stripe not ready"
          empty="All active restaurants can take card payments."
          href="/admin/restaurants"
          items={stripeIssues.map((restaurant) => ({
            id: restaurant.id,
            href: `/admin/restaurants/${restaurant.id}`,
            title: restaurant.name,
            detail: restaurant.stripe_account_id ? 'Charges not enabled' : 'Not connected',
          }))}
        />
      </div>

      {holidayRestaurants.length > 0 && (
        <p className="text-sm text-amber-300">
          Holiday mode:{' '}
          {holidayRestaurants.map((restaurant, index) => (
            <span key={restaurant.id}>
              {index > 0 ? ', ' : ''}
              <Link href={`/admin/restaurants/${restaurant.id}`} className="cursor-pointer underline">
                {restaurant.name}
              </Link>
            </span>
          ))}
        </p>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-white">Today by restaurant</h2>
          <Link href="/admin/reports" className="cursor-pointer text-sm text-violet-400">
            Sales reports
          </Link>
        </div>
        {topRestaurants.length === 0 ? (
          <p className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-8 text-center text-sm text-slate-500">
            No paid orders yet today.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Restaurant</th>
                  <th className="px-4 py-3 font-medium">Orders</th>
                  <th className="px-4 py-3 font-medium">Sales</th>
                  <th className="px-4 py-3 font-medium">Platform</th>
                </tr>
              </thead>
              <tbody>
                {topRestaurants.map((restaurant) => (
                  <tr key={restaurant.id} className="border-t border-slate-800">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/restaurants/${restaurant.id}`}
                        className="cursor-pointer font-medium text-white hover:underline"
                      >
                        {restaurant.name}
                      </Link>
                      <p className="text-xs text-slate-500">/{restaurant.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{restaurant.orders}</td>
                    <td className="px-4 py-3 text-slate-300">{formatPence(restaurant.gmv)}</td>
                    <td className="px-4 py-3 text-violet-300">{formatPence(restaurant.platform)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-white">Latest customers</h2>
          <Link href="/admin/customers" className="cursor-pointer text-sm text-violet-400">
            View all
          </Link>
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {newestCustomers.length === 0 && (
            <p className="text-sm text-slate-500">No customer accounts yet.</p>
          )}
          {newestCustomers.map((customer) => (
            <div key={customer.id} className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
              <p className="font-medium text-white">{customer.name}</p>
              <p className="text-xs text-slate-500">
                {customer.restaurant.name} · {customer.email} · {customer._count.orders} orders
              </p>
              <p className="text-xs text-slate-600">Joined {formatLondonWhen(customer.created_at)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function AttentionCard({
  title,
  empty,
  href,
  items,
}: {
  title: string
  empty: string
  href: string
  items: { id: string; href: string; title: string; detail: string }[]
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-white">{title}</h2>
        <Link href={href} className="cursor-pointer text-xs text-violet-400">
          Open
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">{empty}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Link key={item.id} href={item.href} className="block cursor-pointer hover:text-white">
              <p className="text-sm text-slate-200">{item.title}</p>
              <p className="text-xs text-slate-500">{item.detail}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
