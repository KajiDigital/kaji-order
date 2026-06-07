'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatOrderNumber, formatPence } from '@/app/lib/utils'

type Order = {
  id: string
  order_number: number
  customer_name: string
  total_pence: number
  status: string
  created_at: string
}

type Restaurant = {
  id: string
  name: string
  slug: string
  email?: string | null
  pricing_plan: string
  commission_pct: number
  orders: Order[]
}

export function AdminRestaurantDetail({
  restaurant,
  commissionThisMonth,
}: {
  restaurant: Restaurant
  commissionThisMonth: number
}) {
  const [commissionPct, setCommissionPct] = useState(restaurant.commission_pct)
  const [saving, setSaving] = useState(false)

  async function saveCommission() {
    setSaving(true)
    await fetch(`/api/admin/restaurants/${restaurant.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commission_pct: commissionPct }),
    })
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <Link href="/admin" className="text-sm text-violet-400">← Back</Link>
      <h1 className="text-2xl font-bold text-white">{restaurant.name}</h1>
      <p className="text-slate-400">/{restaurant.slug} · {restaurant.pricing_plan}</p>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="font-semibold text-white mb-2">Commission this month</h2>
        <p className="text-2xl text-violet-400">{formatPence(commissionThisMonth)}</p>
        <div className="flex gap-2 mt-4 items-end">
          <div>
            <label className="text-xs text-slate-400">Override commission %</label>
            <input
              type="number"
              value={commissionPct}
              onChange={(e) => setCommissionPct(parseInt(e.target.value, 10))}
              className="block mt-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white w-24"
            />
          </div>
          <button type="button" onClick={saveCommission} disabled={saving} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm">
            Save
          </button>
          <button type="button" className="px-4 py-2 bg-slate-800 text-slate-400 rounded-lg text-sm" disabled>
            Generate invoice (coming soon)
          </button>
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-white mb-4">Recent orders</h2>
        <div className="space-y-2">
          {restaurant.orders.map((order) => (
            <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex justify-between">
              <div>
                <p className="text-white font-medium">{formatOrderNumber(order.order_number)}</p>
                <p className="text-sm text-slate-400">{order.customer_name}</p>
              </div>
              <div className="text-right">
                <p className="text-white">{formatPence(order.total_pence)}</p>
                <p className="text-xs text-slate-500">{order.status}</p>
              </div>
            </div>
          ))}
          {restaurant.orders.length === 0 && (
            <p className="text-slate-500 text-sm">No orders yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
