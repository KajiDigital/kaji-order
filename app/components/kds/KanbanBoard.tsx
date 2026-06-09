'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { formatOrderNumber, formatPence } from '@/app/lib/utils'
import { canRefundOrder } from '@/app/lib/refunds'
import { RefundDialog } from './RefundDialog'
import { AcceptOrderModal } from './AcceptOrderModal'
import { OrderTodayPanel, OrderArchivePanel } from './OrderHistoryPanel'

type OrderItem = {
  id: string
  name: string
  quantity: number
  price_pence: number
  modifiers_json?: unknown
}

type Order = {
  id: string
  order_number: number
  status: string
  order_type: string
  customer_name: string
  customer_phone?: string | null
  customer_email: string
  notes?: string | null
  total_pence: number
  stripe_payment_status: string
  refund_reason?: string | null
  refund_amount_pence?: number | null
  is_preorder: boolean
  preorder_for?: string | null
  delivery_address?: string | null
  accept_by?: string | null
  created_at: string
  items: OrderItem[]
}

type RestaurantSettings = {
  order_mode: string
  acceptance_timer_mins: number
  avg_prep_minutes: number
  auto_accept_orders: boolean
  auto_accept_delay_minutes: number
  accept_timeout_minutes: number
  sound_alerts: boolean
}

const COLUMNS = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'] as const

function playAlertSound() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.value = 0.15
    osc.start()
    setTimeout(() => {
      osc.stop()
      ctx.close()
    }, 200)
  } catch {
    /* ignore */
  }
}

function playUrgentAlert() {
  try {
    const ctx = new AudioContext()
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 1100
      gain.gain.value = 0.2
      const start = ctx.currentTime + i * 0.3
      osc.start(start)
      osc.stop(start + 0.15)
    }
    setTimeout(() => ctx.close(), 1000)
  } catch {
    /* ignore */
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function formatPreorderTime(iso: string | null | undefined) {
  if (!iso) return 'opening time'
  return new Date(iso).toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function renderOrderCard(
  order: Order,
  col: (typeof COLUMNS)[number],
  onSelect: (order: Order) => void,
  action: (id: string, endpoint: string, body?: object) => Promise<void>,
  setSelected: (order: Order) => void,
  settings: RestaurantSettings,
  setAcceptTarget: (order: Order) => void
) {
  const manualMode = settings.order_mode === 'manual'
  const isPendingManual = col === 'PENDING' && !order.is_preorder && manualMode

  return (
    <button
      key={order.id}
      type="button"
      onClick={() => onSelect(order)}
      className={`w-full text-left bg-slate-800 border rounded-lg p-3 hover:border-violet-500 transition-colors ${
        isPendingManual
          ? 'border-red-500 animate-pulse ring-2 ring-red-500/50'
          : 'border-slate-700'
      }`}
    >
      <div className="flex justify-between items-start">
        <span className="font-bold text-white">{formatOrderNumber(order.order_number)}</span>
        <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
          {order.order_type}
        </span>
      </div>
      {order.is_preorder && (
        <p className="text-xs text-amber-400 mt-1">
          🕐 Pre-order for {formatPreorderTime(order.preorder_for)}
        </p>
      )}
      <p className="text-sm text-slate-300 mt-1">{order.customer_name}</p>
      <p className="text-xs text-slate-500 mt-1 truncate">
        {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
      </p>
      <p className="text-sm font-medium text-violet-400 mt-2">{formatPence(order.total_pence)}</p>
      <p className="text-xs text-slate-500">{formatTime(order.created_at)}</p>
      {col === 'PENDING' && !order.is_preorder && (
        <Countdown
          createdAt={order.created_at}
          timeoutMinutes={
            manualMode ? settings.acceptance_timer_mins : settings.accept_timeout_minutes
          }
          autoAccept={!manualMode && settings.auto_accept_orders}
          autoDelayMinutes={settings.auto_accept_delay_minutes}
          acceptBy={order.accept_by}
          manualMode={manualMode}
        />
      )}
      <div className="flex flex-wrap gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
        {col === 'PENDING' && (
          <>
            <ActionBtn
              label="Accept"
              onClick={() => {
                if (manualMode) {
                  setAcceptTarget(order)
                } else {
                  action(order.id, 'accept')
                }
              }}
            />
            <ActionBtn label="Reject" variant="danger" onClick={() => setSelected(order)} />
          </>
        )}
        {col === 'ACCEPTED' && (
          <ActionBtn label="Start Preparing" onClick={() => action(order.id, 'preparing')} />
        )}
        {col === 'PREPARING' && (
          <ActionBtn label="Mark Ready" onClick={() => action(order.id, 'ready')} />
        )}
        {col === 'READY' && (
          <ActionBtn label="Collected" onClick={() => action(order.id, 'collected')} />
        )}
      </div>
    </button>
  )
}

function Countdown({
  createdAt,
  timeoutMinutes,
  autoAccept,
  autoDelayMinutes,
  acceptBy,
  manualMode,
}: {
  createdAt: string
  timeoutMinutes: number
  autoAccept: boolean
  autoDelayMinutes: number
  acceptBy?: string | null
  manualMode?: boolean
}) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    const deadlineMs = acceptBy
      ? new Date(acceptBy).getTime()
      : autoAccept
        ? new Date(createdAt).getTime() + autoDelayMinutes * 60 * 1000
        : new Date(createdAt).getTime() + timeoutMinutes * 60 * 1000

    const tick = () => {
      setRemaining(Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000)))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [createdAt, timeoutMinutes, autoAccept, autoDelayMinutes, acceptBy])

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const label = manualMode
    ? 'Respond within'
    : autoAccept
      ? 'Auto-accepting in'
      : 'Accept within'

  return (
    <p className={`text-xs mt-1 ${remaining < 60 ? 'text-red-400' : 'text-amber-400'}`}>
      {label} {mins}:{String(secs).padStart(2, '0')}
    </p>
  )
}

export function KanbanBoard({
  initialOrders,
  settings,
}: {
  initialOrders: Order[]
  settings: RestaurantSettings
}) {
  const [orders, setOrders] = useState(initialOrders)
  const [view, setView] = useState<'live' | 'today' | 'archive'>('live')
  const [selected, setSelected] = useState<Order | null>(null)
  const [acceptTarget, setAcceptTarget] = useState<Order | null>(null)
  const [refundTarget, setRefundTarget] = useState<Order | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const knownPending = useRef(new Set(initialOrders.filter((o) => o.status === 'PENDING').map((o) => o.id)))

  const fetchOrders = useCallback(async () => {
    await fetch('/api/orders/check-expired')
    const res = await fetch('/api/orders?view=active')
    if (!res.ok) return
    const data = await res.json()
    const newOrders: Order[] = data.orders

    if (settings.sound_alerts) {
      for (const o of newOrders) {
        if (o.status === 'PENDING' && !knownPending.current.has(o.id)) {
          if (settings.order_mode === 'manual') {
            playUrgentAlert()
          } else {
            playAlertSound()
          }
          if (Notification.permission === 'granted') {
            new Notification('New order!', {
              body: `${formatOrderNumber(o.order_number)} — ${formatPence(o.total_pence)}`,
            })
          }
        }
      }
    }

    knownPending.current = new Set(
      newOrders.filter((o) => o.status === 'PENDING').map((o) => o.id)
    )
    setOrders(newOrders)
  }, [settings.sound_alerts, settings.order_mode])

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    const poll = setInterval(fetchOrders, 15000)
    return () => clearInterval(poll)
  }, [fetchOrders])

  useEffect(() => {
    if (settings.order_mode === 'manual') return

    const timers = orders
      .filter((o) => o.status === 'PENDING')
      .map((order) => {
        const created = new Date(order.created_at).getTime()
        const delayMs = settings.auto_accept_orders
          ? settings.auto_accept_delay_minutes * 60 * 1000
          : settings.accept_timeout_minutes * 60 * 1000

        const remaining = created + delayMs - Date.now()
        if (remaining <= 0) return null

        return setTimeout(async () => {
          const actionEndpoint = settings.auto_accept_orders ? 'accept' : 'reject'
          await fetch(`/api/orders/${order.id}/${actionEndpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body:
              actionEndpoint === 'reject'
                ? JSON.stringify({ reason: 'Order timed out' })
                : undefined,
          })
          fetchOrders()
        }, remaining)
      })
      .filter(Boolean)

    return () => timers.forEach((t) => t && clearTimeout(t))
  }, [orders, settings, fetchOrders])

  async function action(id: string, endpoint: string, body?: object) {
    await fetch(`/api/orders/${id}/${endpoint}`, {
      method: 'POST',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    fetchOrders()
    setAcceptTarget(null)
    setSelected(null)
  }

  async function handleAcceptWithPrep(prepTimeMins: number) {
    if (!acceptTarget) return
    await action(acceptTarget.id, 'accept', { prep_time_mins: prepTimeMins })
  }

  async function handleRefund(reason: string, _amountPence?: number) {
    if (!refundTarget) return
    const res = await fetch(`/api/orders/${refundTarget.id}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error ?? 'Refund failed')
    }
    await fetchOrders()
    setSelected(null)
  }

  const showRefundButton = (order: Order) =>
    canRefundOrder(order.status, order.stripe_payment_status as never)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Orders</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-slate-900 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setView('live')}
              className={`px-3 py-1.5 rounded-md text-sm ${
                view === 'live' ? 'bg-violet-600 text-white' : 'text-slate-400'
              }`}
            >
              Live
            </button>
            <button
              type="button"
              onClick={() => setView('today')}
              className={`px-3 py-1.5 rounded-md text-sm ${
                view === 'today' ? 'bg-violet-600 text-white' : 'text-slate-400'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setView('archive')}
              className={`px-3 py-1.5 rounded-md text-sm ${
                view === 'archive' ? 'bg-violet-600 text-white' : 'text-slate-400'
              }`}
            >
              Archive
            </button>
          </div>
          {view === 'live' && (
            <span className="flex items-center gap-2 text-sm text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          )}
        </div>
      </div>

      {view === 'live' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const colOrders = orders.filter((o) => o.status === col)
            const preorders = col === 'PENDING' ? colOrders.filter((o) => o.is_preorder) : []
            const regular = col === 'PENDING' ? colOrders.filter((o) => !o.is_preorder) : colOrders

            return (
              <div key={col} className="bg-slate-900/50 rounded-xl p-3 min-h-[200px]">
                <h2 className="text-xs font-semibold text-slate-400 mb-3 tracking-wide">
                  {col}
                  {col === 'PENDING' && preorders.length > 0 && (
                    <span className="ml-2 text-amber-400">({preorders.length} pre-orders)</span>
                  )}
                </h2>
                <div className="space-y-3">
                  {col === 'PENDING' && preorders.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                        Pre-orders waiting
                      </p>
                      {preorders.map((order) =>
                        renderOrderCard(
                          order,
                          col,
                          setSelected,
                          action,
                          setSelected,
                          settings,
                          setAcceptTarget
                        )
                      )}
                    </div>
                  )}
                  {regular.map((order) =>
                    renderOrderCard(
                      order,
                      col,
                      setSelected,
                      action,
                      setSelected,
                      settings,
                      setAcceptTarget
                    )
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {view === 'today' && <OrderTodayPanel />}
      {view === 'archive' && <OrderArchivePanel />}

      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{formatOrderNumber(selected.order_number)}</h3>
              <button type="button" onClick={() => setSelected(null)} className="text-slate-400">✕</button>
            </div>
            <p className="text-slate-300">{selected.customer_name}</p>
            <p className="text-sm text-slate-500">{selected.customer_email}</p>
            {selected.customer_phone && <p className="text-sm text-slate-500">{selected.customer_phone}</p>}
            {selected.delivery_address && (
              <p className="text-sm text-slate-400 mt-2">{selected.delivery_address}</p>
            )}
            {selected.notes && <p className="text-sm text-amber-400 mt-2">Notes: {selected.notes}</p>}
            {selected.is_preorder && (
              <p className="text-sm text-amber-400 mt-2">
                Pre-order for {formatPreorderTime(selected.preorder_for)}
              </p>
            )}
            {selected.refund_reason && (
              <p className="text-sm text-red-400 mt-2">Refund reason: {selected.refund_reason}</p>
            )}
            <ul className="mt-4 space-y-2">
              {selected.items.map((item) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span className="text-slate-300">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="text-white">{formatPence(item.price_pence * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 font-bold text-white">{formatPence(selected.total_pence)}</p>
            {selected.status === 'PENDING' && (
              <div className="mt-4 space-y-2">
                <input
                  placeholder="Reject reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                />
                <button
                  type="button"
                  onClick={() => action(selected.id, 'reject', { reason: rejectReason || 'Rejected' })}
                  className="w-full py-2 bg-red-600 text-white rounded-lg text-sm"
                >
                  Reject order
                </button>
              </div>
            )}
            {showRefundButton(selected) && (
              <button
                type="button"
                onClick={() => setRefundTarget(selected)}
                className="w-full mt-4 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg text-sm hover:bg-red-600/30"
              >
                Refund {formatPence(selected.total_pence)}
              </button>
            )}
          </div>
        </div>
      )}

      {refundTarget && (
        <RefundDialog
          customerName={refundTarget.customer_name}
          amountPence={refundTarget.total_pence}
          onConfirm={handleRefund}
          onClose={() => {
            setRefundTarget(null)
          }}
        />
      )}

      {acceptTarget && (
        <AcceptOrderModal
          orderNumber={acceptTarget.order_number}
          defaultPrepMins={settings.avg_prep_minutes}
          onCancel={() => setAcceptTarget(null)}
          onAccept={handleAcceptWithPrep}
        />
      )}
    </div>
  )
}

function ActionBtn({
  label,
  onClick,
  variant = 'primary',
}: {
  label: string
  onClick: () => void
  variant?: 'primary' | 'danger'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs px-2 py-1 rounded ${
        variant === 'danger'
          ? 'bg-red-600/20 text-red-400 hover:bg-red-600/40'
          : 'bg-violet-600/20 text-violet-300 hover:bg-violet-600/40'
      }`}
    >
      {label}
    </button>
  )
}
