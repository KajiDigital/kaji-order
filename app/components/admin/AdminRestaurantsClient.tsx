'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatPence } from '@/app/lib/utils'
import {
  ADMIN_FIELD_CLASS,
  ADMIN_FIELD_PLACEHOLDER_CLASS,
  LOGIN_FILTER_OPTIONS,
  formatAdminDate,
  formatLastLogin,
  matchesLoginFilter,
} from '@/app/lib/admin-format'
import { useDisplayedSelection } from '@/app/components/admin/use-displayed-selection'

type Restaurant = {
  id: string
  name: string
  slug: string
  email?: string | null
  phone?: string | null
  contact_name?: string | null
  restaurant_type?: string | null
  status: string
  pricing_plan: string
  created_at: string
  last_login_at: string | null
  ordersToday: number
  commissionToday: number
}

type BulkAction = 'activate' | 'deactivate' | 'approve' | 'reject'

function statusClass(status: string) {
  if (status === 'active') return 'bg-emerald-950 text-emerald-300'
  if (status === 'pending') return 'bg-amber-950 text-amber-300'
  return 'bg-slate-800 text-slate-400'
}

const ACTION_COPY: Record<BulkAction, { label: string; confirm: string }> = {
  activate: {
    label: 'Activate',
    confirm: 'Activate the selected restaurants so they can take orders again?',
  },
  deactivate: {
    label: 'Deactivate',
    confirm: 'Deactivate the selected restaurants? Their public menus will go offline.',
  },
  approve: {
    label: 'Approve',
    confirm: 'Approve the selected pending restaurants and send invite emails?',
  },
  reject: {
    label: 'Reject',
    confirm: 'Reject the selected pending restaurants?',
  },
}

export function AdminRestaurantsClient({
  restaurants,
}: {
  restaurants: Restaurant[]
}) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('active')
  const [plan, setPlan] = useState('all')
  const [orders, setOrders] = useState('all')
  const [login, setLogin] = useState('all')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const list = useMemo(() => {
    const query = q.trim().toLowerCase()
    return restaurants.filter((restaurant) => {
      if (status !== 'all' && restaurant.status !== status) return false
      if (plan !== 'all' && restaurant.pricing_plan !== plan) return false
      if (orders === 'with' && restaurant.ordersToday === 0) return false
      if (orders === 'none' && restaurant.ordersToday > 0) return false
      if (!matchesLoginFilter(restaurant.last_login_at, login)) return false
      if (!query) return true
      return [restaurant.name, restaurant.slug, restaurant.email, restaurant.phone, restaurant.contact_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    })
  }, [restaurants, q, status, plan, orders, login])

  const {
    selectedIds,
    selectedSet,
    allDisplayedSelected,
    someDisplayedSelected,
    toggle,
    toggleDisplayed,
    clear,
  } = useDisplayedSelection(list.map((restaurant) => restaurant.id))

  const selected = restaurants.filter((restaurant) => selectedSet.has(restaurant.id))

  const counts = useMemo(
    () => ({
      pending: restaurants.filter((r) => r.status === 'pending').length,
      active: restaurants.filter((r) => r.status === 'active').length,
      suspended: restaurants.filter((r) => r.status === 'suspended').length,
    }),
    [restaurants]
  )

  function selectedFor(action: BulkAction) {
    if (action === 'activate') return selected.filter((r) => r.status === 'suspended')
    if (action === 'deactivate') return selected.filter((r) => r.status === 'active')
    return selected.filter((r) => r.status === 'pending')
  }

  async function runAction(action: BulkAction, ids = selectedFor(action).map((r) => r.id)) {
    if (ids.length === 0) return
    if (!confirm(`${ACTION_COPY[action].confirm}\n\n${ids.length} restaurant${ids.length === 1 ? '' : 's'}.`)) {
      return
    }
    setBusy(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/restaurants/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data.error ?? 'Action failed')
        return
      }
      const skipped = (data.skipped ?? []) as { name: string; error: string }[]
      setMessage(
        skipped.length
          ? `${data.updated} updated. ${skipped.map((item) => `${item.name}: ${item.error}`).join(' · ')}`
          : `${data.updated} restaurant${data.updated === 1 ? '' : 's'} updated.`
      )
      clear()
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-white">Restaurants</h1>
      <p className="mb-6 text-sm text-slate-400">
        {counts.active} active · {counts.pending} pending · {counts.suspended} deactivated
      </p>

      <div className="mb-6 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email or phone"
          className={ADMIN_FIELD_PLACEHOLDER_CLASS}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={ADMIN_FIELD_CLASS}
        >
          <option value="active">Active restaurants</option>
          <option value="pending">Pending requests</option>
          <option value="suspended">Deactivated</option>
          <option value="all">All restaurants</option>
        </select>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className={ADMIN_FIELD_CLASS}
        >
          <option value="all">All plans</option>
          <option value="COMMISSION">Commission</option>
          <option value="MONTHLY">Monthly</option>
          <option value="WEEKLY">Weekly</option>
          <option value="BUNDLE">Bundle</option>
        </select>
        <select
          value={orders}
          onChange={(e) => setOrders(e.target.value)}
          className={ADMIN_FIELD_CLASS}
        >
          <option value="all">All order activity</option>
          <option value="with">Has orders today</option>
          <option value="none">No orders today</option>
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
        <p className="text-xs text-slate-500">{list.length} shown</p>
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-violet-200">{selectedIds.length} selected</span>
            <button
              type="button"
              onClick={toggleDisplayed}
              className="cursor-pointer rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-700"
            >
              {allDisplayedSelected ? 'Clear displayed' : `Select all ${list.length} displayed`}
            </button>
            {(['activate', 'deactivate', 'approve', 'reject'] as BulkAction[]).map((action) => {
              const count = selectedFor(action).length
              return (
                <button
                  key={action}
                  type="button"
                  disabled={busy || count === 0}
                  onClick={() => runAction(action)}
                  className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40 ${
                    action === 'deactivate' || action === 'reject'
                      ? 'bg-red-900/70 text-red-100 hover:bg-red-800'
                      : 'bg-emerald-900/70 text-emerald-100 hover:bg-emerald-800'
                  }`}
                >
                  {ACTION_COPY[action].label} ({count})
                </button>
              )
            })}
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

      {message && <p className="mb-3 text-sm text-violet-200">{message}</p>}

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
                  disabled={list.length === 0}
                  aria-label="Select all displayed restaurants"
                  className="h-4 w-4 cursor-pointer accent-violet-500 disabled:cursor-not-allowed"
                />
              </th>
              <th className="px-4 py-3 font-medium">Restaurant</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Today</th>
              <th className="px-4 py-3 font-medium">Last login</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                  No restaurants match these filters.
                </td>
              </tr>
            )}
            {list.map((restaurant) => {
              const loginInfo = formatLastLogin(restaurant.last_login_at)
              return (
                <tr
                  key={restaurant.id}
                  className={`border-t border-slate-800 ${
                    selectedSet.has(restaurant.id) ? 'bg-slate-900/80' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedSet.has(restaurant.id)}
                      onChange={() => toggle(restaurant.id)}
                      aria-label={`Select ${restaurant.name}`}
                      className="h-4 w-4 cursor-pointer accent-violet-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/restaurants/${restaurant.id}`}
                      className="cursor-pointer font-medium text-white hover:underline"
                    >
                      {restaurant.name}
                    </Link>
                    <p className="text-xs text-slate-500">/{restaurant.slug}</p>
                    {restaurant.restaurant_type && (
                      <p className="text-xs text-slate-500">{restaurant.restaurant_type}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    <p>{restaurant.email || '—'}</p>
                    {restaurant.contact_name && (
                      <p className="text-xs text-slate-500">{restaurant.contact_name}</p>
                    )}
                    {restaurant.phone && <p className="text-xs text-slate-500">{restaurant.phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{restaurant.pricing_plan}</td>
                  <td className="px-4 py-3 text-slate-300">
                    <p>{restaurant.ordersToday} orders</p>
                    <p className="text-xs text-violet-400">{formatPence(restaurant.commissionToday)}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    <p>{loginInfo.when}</p>
                    <p className="text-xs text-slate-500">{loginInfo.ago}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{formatAdminDate(restaurant.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs capitalize ${statusClass(restaurant.status)}`}>
                      {restaurant.status === 'suspended' ? 'Deactivated' : restaurant.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {restaurant.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => runAction('approve', [restaurant.id])}
                            className="cursor-pointer rounded-lg bg-emerald-700 px-2.5 py-1 text-xs text-white disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => runAction('reject', [restaurant.id])}
                            className="cursor-pointer rounded-lg bg-red-700/80 px-2.5 py-1 text-xs text-white disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {restaurant.status === 'active' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => runAction('deactivate', [restaurant.id])}
                          className="cursor-pointer rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-200 disabled:opacity-50"
                        >
                          Deactivate
                        </button>
                      )}
                      {restaurant.status === 'suspended' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => runAction('activate', [restaurant.id])}
                          className="cursor-pointer rounded-lg bg-emerald-800 px-2.5 py-1 text-xs text-emerald-100 disabled:opacity-50"
                        >
                          Activate
                        </button>
                      )}
                    </div>
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
