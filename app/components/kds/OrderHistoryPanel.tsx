'use client'

import { useCallback, useEffect, useState } from 'react'
import { formatOrderNumber, formatPence } from '@/app/lib/utils'

type OrderItem = {
  id: string
  name: string
  quantity: number
  base_price: number
  total_price: number
}

type Order = {
  id: string
  order_number: number
  status: string
  order_type: string
  customer_name: string
  customer_phone?: string | null
  total_pence: number
  created_at: string
  items: OrderItem[]
}

type TodayStats = { count: number; revenue: number; cancelled: number }

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function OrderTodayPanel() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<TodayStats>({ count: 0, revenue: 0, cancelled: 0 })
  const [selected, setSelected] = useState<Order | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/orders?view=today')
    if (!res.ok) return
    const data = await res.json()
    setOrders(data.orders)
    setStats(data.stats)
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [load])

  return (
    <div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 mb-4 text-sm text-slate-300">
        {stats.count} orders · {formatPence(stats.revenue)}
        {stats.cancelled > 0 && ` · ${stats.cancelled} cancelled`}
      </div>

      <div className="space-y-2">
        {orders.length === 0 ? (
          <p className="text-slate-500 text-sm">No orders today yet.</p>
        ) : (
          orders.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => setSelected(order)}
              className="w-full text-left bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-violet-500"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-white">{formatOrderNumber(order.order_number)}</p>
                  <p className="text-sm text-slate-400">{order.customer_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">{formatPence(order.total_pence)}</p>
                  <p className="text-xs text-slate-500">{formatTime(order.created_at)}</p>
                  <p className="text-xs capitalize text-violet-400 mt-1">{order.status.toLowerCase()}</p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {selected && (
        <OrderDetailModal order={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

export function OrderArchivePanel() {
  const [orders, setOrders] = useState<Order[]>([])
  const [from, setFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().slice(0, 10)
  })
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [orderType, setOrderType] = useState('all')
  const [selected, setSelected] = useState<Order | null>(null)

  const load = useCallback(async () => {
    const params = new URLSearchParams({
      view: 'archive',
      from,
      to,
      ...(search && { search }),
      ...(status !== 'all' && { status }),
      ...(orderType !== 'all' && { order_type: orderType }),
    })
    const res = await fetch(`/api/orders?${params}`)
    if (!res.ok) return
    const data = await res.json()
    setOrders(data.orders)
  }, [from, to, search, status, orderType])

  useEffect(() => {
    load()
  }, [load])

  function exportCsv() {
    const header = 'Order,Customer,Phone,Status,Type,Total,Time\n'
    const rows = orders
      .map(
        (o) =>
          `${formatOrderNumber(o.order_number)},"${o.customer_name}","${o.customer_phone ?? ''}",${o.status},${o.order_type},${(o.total_pence / 100).toFixed(2)},${o.created_at}`
      )
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-${from}-${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
        <input placeholder="Search name, phone, order #" value={search} onChange={(e) => setSearch(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm">
          <option value="all">All statuses</option>
          <option value="COLLECTED">Collected</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REJECTED">Rejected</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>

      <div className="flex gap-2">
        <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm">
          <option value="all">All types</option>
          <option value="COLLECTION">Collection</option>
          <option value="DELIVERY">Delivery</option>
        </select>
        <button type="button" onClick={load} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm">Search</button>
        <button type="button" onClick={exportCsv} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm">Export CSV</button>
      </div>

      <div className="space-y-2">
        {orders.map((order) => (
          <button
            key={order.id}
            type="button"
            onClick={() => setSelected(order)}
            className="w-full text-left bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-violet-500"
          >
            <div className="flex justify-between">
              <div>
                <p className="font-bold text-white">{formatOrderNumber(order.order_number)}</p>
                <p className="text-sm text-slate-400">{order.customer_name}</p>
              </div>
              <div className="text-right">
                <p className="text-white">{formatPence(order.total_pence)}</p>
                <p className="text-xs text-slate-500 capitalize">{order.status.toLowerCase()}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <OrderDetailModal order={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white">{formatOrderNumber(order.order_number)}</h2>
        <p className="text-slate-400 text-sm mt-1">{order.customer_name}</p>
        {order.customer_phone && <p className="text-slate-400 text-sm">{order.customer_phone}</p>}
        <p className="text-xs text-slate-500 mt-2 capitalize">{order.status} · {order.order_type}</p>
        <ul className="mt-4 space-y-1 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between text-slate-300">
              <span>{item.quantity}x {item.name}</span>
              <span>{formatPence(item.total_price || item.base_price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <p className="font-bold text-white mt-4">{formatPence(order.total_pence)}</p>
        <button type="button" onClick={onClose} className="mt-4 w-full py-2 bg-slate-800 text-white rounded-lg text-sm">Close</button>
      </div>
    </div>
  )
}
