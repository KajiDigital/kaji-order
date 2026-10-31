'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatPence } from '@/app/lib/utils'
import { ADMIN_FIELD_CLASS, formatAdminDate, plural } from '@/app/lib/admin-format'
import { AdminStat } from '@/app/components/admin/AdminStat'

type Restaurant = { id: string; name: string }

type Report = {
  label: string
  start: string
  end: string
  summary: {
    orders: number
    sales: number
    food: number
    aov: number
    commission: number
    service_fees: number
    platform: number
    collection_orders: number
    collection_sales: number
    delivery_orders: number
    delivery_sales: number
    refunded_orders: number
    refunded_sales: number
  }
  restaurants: {
    id: string
    name: string
    slug: string
    orders: number
    sales: number
    food: number
    commission: number
    service_fees: number
    platform: number
  }[]
  days: {
    date: string
    orders: number
    sales: number
    commission: number
    service_fees: number
    platform: number
  }[]
}

export function AdminReportsClient({
  restaurants,
}: {
  restaurants: Restaurant[]
}) {
  const [range, setRange] = useState('month')
  const [restaurantId, setRestaurantId] = useState('')
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams({ range })
    if (restaurantId) params.set('restaurant_id', restaurantId)
    setLoading(true)
    fetch(`/api/admin/reports?${params}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setReport(data.error ? null : data))
      .finally(() => setLoading(false))
  }, [range, restaurantId])

  const summary = report?.summary

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-white">Reports</h1>
      <p className="mb-6 text-sm text-slate-400">
        Sales and platform earnings in Europe/London
        {report ? ` · ${report.label}` : ''}
      </p>

      <div className="mb-6 grid gap-3 md:grid-cols-2">
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className={ADMIN_FIELD_CLASS}
        >
          <option value="today">Today</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="month">This month</option>
          <option value="last_month">Last month</option>
        </select>
        <select
          value={restaurantId}
          onChange={(e) => setRestaurantId(e.target.value)}
          className={ADMIN_FIELD_CLASS}
        >
          <option value="">All restaurants</option>
          {restaurants.map((restaurant) => (
            <option key={restaurant.id} value={restaurant.id}>
              {restaurant.name}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading report…</p>}

      {!loading && summary && (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStat label="Orders" value={String(summary.orders)} hint={`${summary.refunded_orders} refunded`} />
            <AdminStat label="Sales" value={formatPence(summary.sales)} hint={`${formatPence(summary.food)} food`} />
            <AdminStat label="Avg order" value={formatPence(summary.aov)} />
            <AdminStat
              label="Platform earnings"
              value={formatPence(summary.platform)}
              hint={`${formatPence(summary.commission)} commission + ${formatPence(summary.service_fees)} fees`}
            />
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-sm text-slate-400">Collection</p>
              <p className="mt-1 text-xl font-semibold text-white">
                {plural(summary.collection_orders, 'order')} · {formatPence(summary.collection_sales)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-sm text-slate-400">Delivery</p>
              <p className="mt-1 text-xl font-semibold text-white">
                {plural(summary.delivery_orders, 'order')} · {formatPence(summary.delivery_sales)}
              </p>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="mb-3 font-semibold text-white">By restaurant</h2>
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Restaurant</th>
                    <th className="px-4 py-3 font-medium">Orders</th>
                    <th className="px-4 py-3 font-medium">Sales</th>
                    <th className="px-4 py-3 font-medium">Commission</th>
                    <th className="px-4 py-3 font-medium">Service fees</th>
                    <th className="px-4 py-3 font-medium">Platform</th>
                  </tr>
                </thead>
                <tbody>
                  {report.restaurants.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No sales in this period.
                      </td>
                    </tr>
                  )}
                  {report.restaurants.map((restaurant) => (
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
                      <td className="px-4 py-3 text-slate-300">{formatPence(restaurant.sales)}</td>
                      <td className="px-4 py-3 text-slate-300">{formatPence(restaurant.commission)}</td>
                      <td className="px-4 py-3 text-slate-300">{formatPence(restaurant.service_fees)}</td>
                      <td className="px-4 py-3 text-violet-300">{formatPence(restaurant.platform)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-semibold text-white">By day</h2>
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Day</th>
                    <th className="px-4 py-3 font-medium">Orders</th>
                    <th className="px-4 py-3 font-medium">Sales</th>
                    <th className="px-4 py-3 font-medium">Commission</th>
                    <th className="px-4 py-3 font-medium">Service fees</th>
                    <th className="px-4 py-3 font-medium">Platform</th>
                  </tr>
                </thead>
                <tbody>
                  {report.days.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No daily totals in this period.
                      </td>
                    </tr>
                  )}
                  {report.days.map((day) => (
                    <tr key={day.date} className="border-t border-slate-800">
                      <td className="px-4 py-3 text-slate-200">{formatAdminDate(`${day.date}T12:00:00`)}</td>
                      <td className="px-4 py-3 text-slate-300">{day.orders}</td>
                      <td className="px-4 py-3 text-slate-300">{formatPence(day.sales)}</td>
                      <td className="px-4 py-3 text-slate-300">{formatPence(day.commission)}</td>
                      <td className="px-4 py-3 text-slate-300">{formatPence(day.service_fees)}</td>
                      <td className="px-4 py-3 text-violet-300">{formatPence(day.platform)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
