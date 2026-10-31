'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ADMIN_FIELD_CLASS,
  ADMIN_FIELD_PLACEHOLDER_CLASS,
  LOGIN_FILTER_OPTIONS,
  formatAdminDate,
  formatLastLogin,
} from '@/app/lib/admin-format'
import { useDisplayedSelection } from '@/app/components/admin/use-displayed-selection'

type Restaurant = {
  id: string
  name: string
  slug: string
}

type Customer = {
  id: string
  name: string
  email: string
  phone: string | null
  created_at: string
  deleted_at: string | null
  order_count: number
  last_login_at: string | null
  last_order_number: number | null
  restaurant: Restaurant
}

export function AdminCustomersClient({
  restaurants,
}: {
  restaurants: Restaurant[]
}) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [restaurantId, setRestaurantId] = useState('')
  const [status, setStatus] = useState('active')
  const [orders, setOrders] = useState('all')
  const [login, setLogin] = useState('all')
  const {
    selectedIds,
    selectedSet,
    allDisplayedSelected,
    someDisplayedSelected,
    toggle,
    toggleDisplayed,
    retainVisible,
    clear,
  } = useDisplayedSelection(customers.map((customer) => customer.id))

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ status, orders, login })
      if (q.trim()) params.set('q', q.trim())
      if (restaurantId) params.set('restaurant_id', restaurantId)
      setLoading(true)
      fetch(`/api/admin/customers?${params}`, { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          const next = (data.customers ?? []) as Customer[]
          setCustomers(next)
          retainVisible(next.map((customer) => customer.id))
        })
        .finally(() => setLoading(false))
    }, 200)
    return () => window.clearTimeout(timer)
  }, [q, restaurantId, status, orders, login, retainVisible])

  const counts = useMemo(
    () => ({
      total: customers.length,
      withOrders: customers.filter((customer) => customer.order_count > 0).length,
    }),
    [customers]
  )

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-white">Customers</h1>
      <p className="mb-6 max-w-3xl text-sm text-slate-400">
        Support access only. Kaji is the processor; each restaurant is the controller of
        their diner data. Use this list to help a restaurant or investigate an order —
        not for marketing.
      </p>

      <div className="mb-6 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email or phone"
          className={ADMIN_FIELD_PLACEHOLDER_CLASS}
        />
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
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={ADMIN_FIELD_CLASS}
        >
          <option value="active">Active accounts</option>
          <option value="deleted">Deleted / anonymised</option>
          <option value="all">All accounts</option>
        </select>
        <select
          value={orders}
          onChange={(e) => setOrders(e.target.value)}
          className={ADMIN_FIELD_CLASS}
        >
          <option value="all">All order activity</option>
          <option value="with">Has orders</option>
          <option value="none">No orders</option>
        </select>
        <select
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          className={ADMIN_FIELD_CLASS}
        >
          {LOGIN_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          {loading ? 'Loading…' : `${counts.total} shown · ${counts.withOrders} with orders`}
        </p>
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-violet-200">
              {selectedIds.length} selected
            </span>
            <button
              type="button"
              onClick={toggleDisplayed}
              className="cursor-pointer rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-700"
            >
              {allDisplayedSelected ? 'Clear displayed' : `Select all ${customers.length} displayed`}
            </button>
            <button
              type="button"
              onClick={clear}
              className="cursor-pointer rounded-lg px-2.5 py-1 text-xs text-slate-400 hover:text-white"
            >
              Clear selection
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allDisplayedSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someDisplayedSelected && !allDisplayedSelected
                  }}
                  onChange={toggleDisplayed}
                  disabled={customers.length === 0}
                  aria-label="Select all displayed customers"
                  className="h-4 w-4 cursor-pointer accent-violet-500 disabled:cursor-not-allowed"
                />
              </th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Restaurant</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Orders</th>
              <th className="px-4 py-3 font-medium">Last login</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {!loading && customers.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  No customers match these filters.
                </td>
              </tr>
            )}
            {customers.map((customer) => {
              const loginInfo = formatLastLogin(customer.last_login_at)
              return (
              <tr
                key={customer.id}
                className={`border-t border-slate-800 ${
                  selectedSet.has(customer.id) ? 'bg-slate-900/80' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedSet.has(customer.id)}
                    onChange={() => toggle(customer.id)}
                    aria-label={`Select ${customer.name}`}
                    className="h-4 w-4 cursor-pointer accent-violet-500"
                  />
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{customer.name}</p>
                  {customer.last_order_number != null && (
                    <p className="text-xs text-slate-500">
                      Last order #{customer.last_order_number}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/restaurants/${customer.restaurant.id}`}
                    className="cursor-pointer text-violet-300 hover:underline"
                  >
                    {customer.restaurant.name}
                  </Link>
                  <p className="text-xs text-slate-500">/{customer.restaurant.slug}</p>
                </td>
                <td className="px-4 py-3 text-slate-300">
                  <p>{customer.email}</p>
                  {customer.phone && <p className="text-xs text-slate-500">{customer.phone}</p>}
                </td>
                <td className="px-4 py-3 text-slate-300">{customer.order_count}</td>
                <td className="px-4 py-3 text-slate-300">
                  <p>{loginInfo.when}</p>
                  <p className="text-xs text-slate-500">{loginInfo.ago}</p>
                </td>
                <td className="px-4 py-3 text-slate-400">{formatAdminDate(customer.created_at)}</td>
                <td className="px-4 py-3">
                  {customer.deleted_at ? (
                    <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-400">
                      Anonymised
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-950 px-2 py-1 text-xs text-emerald-300">
                      Active
                    </span>
                  )}
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
