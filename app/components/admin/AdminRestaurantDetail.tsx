'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatOrderNumber, formatPence, getOrderUrl } from '@/app/lib/utils'
import { DEFAULT_PRIMARY, FONT_OPTIONS } from '@/app/lib/branding'
import { canRefundOrder } from '@/app/lib/refunds'
import { RefundDialog } from '@/app/components/kds/RefundDialog'

type Order = {
  id: string
  order_number: number
  customer_name: string
  total_pence: number
  status: string
  stripe_payment_status: string
  refund_reason?: string | null
  refund_amount_pence?: number | null
  created_at: string
}

type AdminPromotion = {
  id: string
  name: string
  promo_type: string
  active: boolean
  uses_count: number
  max_uses: number | null
  badge_text: string | null
  coupon_codes: { code: string; uses_count: number; max_uses: number | null }[]
  order_discount_count: number
}

type RestaurantData = {
  id: string
  name: string
  slug: string
  status: string
  contact_name?: string | null
  email?: string | null
  phone?: string | null
  restaurant_type?: string | null
  pricing_plan: string
  commission_pct: number
  admin_notes?: string | null
  logo_url?: string | null
  banner_url?: string | null
  primary_color?: string | null
  brand_color?: string | null
  font_choice?: string | null
  show_powered_by?: boolean
  created_at: string
  promotions: AdminPromotion[]
  orders: Order[]
}

type Stats = {
  totalOrders: number
  ordersThisMonth: number
  totalCommissionOwed: number
  commissionThisMonth: number
  serviceFeesThisMonth: number
  totalPlatformThisMonth: number
  platformServiceFeePence: number
  lastLogin: string | null
}

const PLANS = ['COMMISSION', 'MONTHLY', 'WEEKLY', 'BUNDLE'] as const
const STATUSES = ['pending', 'active', 'suspended'] as const

function Field({
  label,
  value,
  onChange,
  type = 'text',
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  hint?: string
}) {
  return (
    <div>
      <label className="text-xs text-slate-400">{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
        />
      )}
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  )
}

export function AdminRestaurantDetail({
  restaurant: initial,
  stats,
}: {
  restaurant: RestaurantData
  stats: Stats
}) {
  const router = useRouter()
  const [data, setData] = useState({
    ...initial,
    primary_color: initial.primary_color ?? initial.brand_color ?? DEFAULT_PRIMARY,
    font_choice: initial.font_choice ?? 'default',
    show_powered_by: initial.show_powered_by ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [savingBranding, setSavingBranding] = useState(false)
  const [message, setMessage] = useState('')
  const [refundTarget, setRefundTarget] = useState<Order | null>(null)

  async function saveAll() {
    setSaving(true)
    setMessage('')
    const res = await fetch(`/api/admin/restaurants/${data.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        contact_name: data.contact_name,
        email: data.email,
        phone: data.phone,
        restaurant_type: data.restaurant_type,
        slug: data.slug,
        status: data.status,
        pricing_plan: data.pricing_plan,
        commission_pct: data.commission_pct,
        admin_notes: data.admin_notes,
      }),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) {
      setMessage(json.error ?? 'Save failed')
      return
    }
    setData({ ...data, ...json.restaurant })
    setMessage('Saved')
    router.refresh()
  }

  async function saveBranding() {
    setSavingBranding(true)
    setMessage('')
    const res = await fetch(`/api/admin/restaurants/${data.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        primary_color: data.primary_color,
        logo_url: data.logo_url,
        banner_url: data.banner_url,
        font_choice: data.font_choice,
        show_powered_by: data.show_powered_by,
        pricing_plan: data.pricing_plan,
        commission_pct: data.commission_pct,
      }),
    })
    const json = await res.json()
    setSavingBranding(false)
    if (!res.ok) {
      setMessage(json.error ?? 'Save failed')
      return
    }
    setData({ ...data, ...json.restaurant })
    setMessage('Branding saved')
    router.refresh()
  }

  async function action(path: string, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return
    const res = await fetch(`/api/admin/restaurants/${data.id}/${path}`, { method: 'POST' })
    const json = await res.json()
    if (!res.ok) {
      alert(json.error ?? 'Action failed')
      return
    }
    if (path === 'impersonate' && json.redirect) {
      window.location.href = json.redirect
      return
    }
    if (path === 'delete') {
      router.push('/admin/restaurants')
      return
    }
    router.refresh()
    setMessage(`Action completed: ${path}`)
  }

  async function handleAdminRefund(reason: string, amountPence?: number) {
    if (!refundTarget) return
    const res = await fetch(`/api/admin/orders/${refundTarget.id}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, amount_pence: amountPence }),
    })
    const json = await res.json()
    if (!res.ok) {
      throw new Error(json.error ?? 'Refund failed')
    }
    router.refresh()
    setRefundTarget(null)
    setMessage('Refund processed successfully')
  }

  return (
    <div className="space-y-8">
      <Link href="/admin/restaurants" className="text-sm text-violet-400">← Back</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{data.name}</h1>
          <p className="text-slate-400 text-sm capitalize">{data.status}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/restaurants/${data.id}/emails`}
            className="px-4 py-2 bg-slate-800 text-slate-200 rounded-lg text-sm hover:bg-slate-700"
          >
            Email templates
          </Link>
          <button
          type="button"
          onClick={saveAll}
          disabled={saving}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save all'}
        </button>
        </div>
      </div>
      {message && <p className="text-sm text-emerald-400">{message}</p>}

      {/* Section 1: Editable details */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Restaurant details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Restaurant name" value={data.name} onChange={(v) => setData({ ...data, name: v })} />
          <Field label="Contact name" value={data.contact_name ?? ''} onChange={(v) => setData({ ...data, contact_name: v })} />
          <Field label="Email" value={data.email ?? ''} onChange={(v) => setData({ ...data, email: v })} type="email" />
          <Field label="Phone" value={data.phone ?? ''} onChange={(v) => setData({ ...data, phone: v })} />
          <Field label="Restaurant type" value={data.restaurant_type ?? ''} onChange={(v) => setData({ ...data, restaurant_type: v })} />
          <Field
            label="Slug"
            value={data.slug}
            onChange={(v) => setData({ ...data, slug: v })}
            hint={getOrderUrl(data.slug)}
          />
          <div>
            <label className="text-xs text-slate-400">Status</label>
            <select
              value={data.status}
              onChange={(e) => setData({ ...data, status: e.target.value })}
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400">Plan</label>
            <select
              value={data.pricing_plan}
              onChange={(e) => setData({ ...data, pricing_plan: e.target.value })}
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              {PLANS.map((p) => (
                <option key={p} value={p}>{p.toLowerCase()}</option>
              ))}
            </select>
          </div>
          <Field
            label="Commission % (admin only)"
            value={String(data.commission_pct)}
            onChange={(v) => setData({ ...data, commission_pct: parseInt(v, 10) || 0 })}
            type="number"
          />
          <div>
            <label className="text-xs text-slate-400">Service fee (platform)</label>
            <p className="mt-1 text-sm text-white">{formatPence(stats.platformServiceFeePence)}</p>
            <p className="text-xs text-slate-500 mt-1">
              Set globally in{' '}
              <Link href="/admin/settings" className="text-violet-400 hover:underline">
                Platform Settings
              </Link>
            </p>
          </div>
        </div>
        <Field
          label="Internal notes (admin only)"
          value={data.admin_notes ?? ''}
          onChange={(v) => setData({ ...data, admin_notes: v })}
          type="textarea"
        />
      </section>

      {/* Branding */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Branding</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400">Primary colour</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={data.primary_color ?? DEFAULT_PRIMARY}
                onChange={(e) => setData({ ...data, primary_color: e.target.value })}
                className="h-9 w-12 cursor-pointer rounded border border-slate-700 bg-slate-800"
              />
              <input
                value={data.primary_color ?? DEFAULT_PRIMARY}
                onChange={(e) => setData({ ...data, primary_color: e.target.value })}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-mono"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400">Font</label>
            <select
              value={data.font_choice ?? 'default'}
              onChange={(e) => setData({ ...data, font_choice: e.target.value })}
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <Field label="Logo URL" value={data.logo_url ?? ''} onChange={(v) => setData({ ...data, logo_url: v })} />
          <Field label="Banner URL" value={data.banner_url ?? ''} onChange={(v) => setData({ ...data, banner_url: v })} />
          <div>
            <label className="text-xs text-slate-400">Plan override</label>
            <select
              value={data.pricing_plan}
              onChange={(e) => setData({ ...data, pricing_plan: e.target.value })}
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              {PLANS.map((p) => (
                <option key={p} value={p}>{p.toLowerCase()}</option>
              ))}
            </select>
          </div>
          <Field
            label="Commission % override"
            value={String(data.commission_pct)}
            onChange={(v) => setData({ ...data, commission_pct: parseInt(v, 10) || 0 })}
            type="number"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={data.show_powered_by ?? true}
            onChange={(e) => setData({ ...data, show_powered_by: e.target.checked })}
          />
          Show &quot;Powered by Kaji&quot; on menu page
        </label>
        <button
          type="button"
          onClick={saveBranding}
          disabled={savingBranding}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm disabled:opacity-50"
        >
          {savingBranding ? 'Saving...' : 'Save branding'}
        </button>
      </section>

      {/* Section 2: Quick actions */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="font-semibold text-white mb-4">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          <ActionBtn label="Send invite email" onClick={() => action('send-invite')} />
          <ActionBtn label="Reset password" onClick={() => action('reset-password', 'Send password reset email?')} />
          <ActionBtn label="Impersonate" onClick={() => action('impersonate')} variant="amber" />
          <ActionBtn label="Suspend account" onClick={() => action('suspend', 'Suspend this account?')} variant="warn" />
          <ActionBtn label="Delete account" onClick={() => action('delete', 'Soft delete this account?')} variant="danger" />
          {data.email && (
            <a href={`mailto:${data.email}`} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-sm">
              Contact
            </a>
          )}
        </div>
      </section>

      {/* Promotions */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="font-semibold text-white">Promotions</h2>
          <button
            type="button"
            onClick={async () => {
              const res = await fetch(`/api/admin/restaurants/${data.id}/impersonate`, { method: 'POST' })
              const json = await res.json()
              if (res.ok) {
                window.location.href = '/dashboard/promotions'
              } else {
                alert(json.error ?? 'Failed to impersonate')
              }
            }}
            className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-sm"
          >
            Create on behalf
          </button>
        </div>
        <div className="space-y-3">
          {data.promotions.map((promo) => (
            <div key={promo.id} className="border border-slate-800 rounded-lg p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-white font-medium">{promo.name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {promo.promo_type.replace(/_/g, ' ')}
                    {!promo.active && ' · Paused'}
                  </p>
                  {promo.badge_text && (
                    <p className="text-xs text-slate-400 mt-1">Badge: {promo.badge_text}</p>
                  )}
                  {promo.coupon_codes.length > 0 && (
                    <p className="text-xs text-slate-400 mt-1">
                      Codes:{' '}
                      {promo.coupon_codes
                        .map((c) => `${c.code} (${c.uses_count}${c.max_uses ? `/${c.max_uses}` : ''})`)
                        .join(', ')}
                    </p>
                  )}
                </div>
                <div className="text-right text-sm">
                  <p className="text-white">{promo.uses_count} uses</p>
                  <p className="text-slate-500 text-xs">{promo.order_discount_count} orders</p>
                </div>
              </div>
            </div>
          ))}
          {data.promotions.length === 0 && (
            <p className="text-slate-500 text-sm">No promotions configured.</p>
          )}
        </div>
      </section>

      {/* Section 3: Activity */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="font-semibold text-white mb-4">Activity</h2>
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <Stat label="Account created" value={new Date(data.created_at).toLocaleDateString('en-GB')} />
          <Stat
            label="Last login"
            value={stats.lastLogin ? new Date(stats.lastLogin).toLocaleString('en-GB') : 'Never'}
          />
          <Stat label="Total orders" value={String(stats.totalOrders)} />
          <Stat label="Orders this month" value={String(stats.ordersThisMonth)} />
          <Stat label="Commission owed" value={formatPence(stats.totalCommissionOwed)} />
          <Stat label="Food commission (month)" value={formatPence(stats.commissionThisMonth)} />
          <Stat label="Service fees (month)" value={formatPence(stats.serviceFeesThisMonth)} />
          <Stat label="Total platform (month)" value={formatPence(stats.totalPlatformThisMonth)} />
        </dl>
      </section>

      {/* Recent orders */}
      <section>
        <h2 className="font-semibold text-white mb-4">Recent orders</h2>
        <div className="space-y-2">
          {data.orders.map((order) => (
            <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="flex justify-between gap-4">
                <div>
                  <p className="text-white font-medium">{formatOrderNumber(order.order_number)}</p>
                  <p className="text-sm text-slate-400">{order.customer_name}</p>
                  {order.refund_reason && (
                    <p className="text-xs text-red-400 mt-1">Refund: {order.refund_reason}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-white">{formatPence(order.total_pence)}</p>
                  <p className={`text-xs ${order.status === 'REFUNDED' || order.status === 'CANCELLED' ? 'text-red-400' : 'text-slate-500'}`}>
                    {order.status}
                  </p>
                </div>
              </div>
              {canRefundOrder(order.status, order.stripe_payment_status as never) && (
                <button
                  type="button"
                  onClick={() => setRefundTarget(order)}
                  className="mt-3 px-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg text-sm hover:bg-red-600/30"
                >
                  Refund
                </button>
              )}
            </div>
          ))}
          {data.orders.length === 0 && (
            <p className="text-slate-500 text-sm">No orders yet.</p>
          )}
        </div>
      </section>

      {refundTarget && (
        <RefundDialog
          customerName={refundTarget.customer_name}
          amountPence={refundTarget.total_pence}
          maxAmountPence={refundTarget.total_pence}
          allowPartial
          onConfirm={handleAdminRefund}
          onClose={() => setRefundTarget(null)}
        />
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-white font-medium mt-0.5">{value}</dd>
    </div>
  )
}

function ActionBtn({
  label,
  onClick,
  variant = 'default',
}: {
  label: string
  onClick: () => void
  variant?: 'default' | 'amber' | 'warn' | 'danger'
}) {
  const styles = {
    default: 'bg-slate-800 text-slate-200 hover:bg-slate-700',
    amber: 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/30',
    warn: 'bg-orange-600/20 text-orange-400 hover:bg-orange-600/30',
    danger: 'bg-red-600/20 text-red-400 hover:bg-red-600/30',
  }
  return (
    <button type="button" onClick={onClick} className={`px-3 py-1.5 rounded-lg text-sm ${styles[variant]}`}>
      {label}
    </button>
  )
}
