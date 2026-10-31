'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatOrderNumber, formatPence, getOrderUrl } from '@/app/lib/utils'
import { formatLondonWhen } from '@/app/lib/admin-format'
import { DEFAULT_PRIMARY, FONT_OPTIONS } from '@/app/lib/branding'
import { canRefundOrder } from '@/app/lib/refunds'
import { RefundDialog } from '@/app/components/kds/RefundDialog'
import { InviteEmailDialog } from '@/app/components/admin/InviteEmailDialog'

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
  stripe_account_id?: string | null
  stripe_charges_enabled?: boolean
  stripe_details_submitted?: boolean
  admin_notes?: string | null
  logo_url?: string | null
  banner_url?: string | null
  primary_color?: string | null
  brand_color?: string | null
  font_choice?: string | null
  show_powered_by?: boolean
  created_at: string
  login_email?: string | null
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
  autoComplete,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  hint?: string
  autoComplete?: string
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
          autoComplete={autoComplete}
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
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [settingPassword, setSettingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [refundTarget, setRefundTarget] = useState<Order | null>(null)
  const [tab, setTab] = useState<'overview' | 'details' | 'branding' | 'orders'>('overview')
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0)
  const [deleteName, setDeleteName] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [deactivateStep, setDeactivateStep] = useState<0 | 1 | 2>(0)
  const [deactivateName, setDeactivateName] = useState('')
  const [deactivating, setDeactivating] = useState(false)

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

  async function setPassword() {
    setPasswordMessage('')
    setPasswordError('')
    if (!data.login_email) {
      setPasswordError('This restaurant has no dashboard login yet.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    setSettingPassword(true)
    const res = await fetch(`/api/admin/restaurants/${data.id}/set-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    })
    const json = await res.json()
    setSettingPassword(false)
    if (!res.ok) {
      setPasswordError(json.error ?? 'Could not set password')
      return
    }
    setNewPassword('')
    setConfirmPassword('')
    setShowResetPassword(false)
    setPasswordMessage(`Password updated for ${json.email ?? data.login_email}`)
  }

  function toggleResetPassword() {
    setShowResetPassword((open) => !open)
    setPasswordError('')
    setPasswordMessage('')
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
    router.refresh()
    setMessage(`Action completed: ${path}`)
  }

  function cancelDelete() {
    setDeleteStep(0)
    setDeleteName('')
    setDeleting(false)
  }

  function cancelDeactivate() {
    setDeactivateStep(0)
    setDeactivateName('')
    setDeactivating(false)
  }

  async function confirmDeactivate() {
    if (deactivateStep === 1) {
      setDeactivateStep(2)
      setDeactivateName('')
      return
    }
    if (deactivateName.trim() !== data.name) return

    setDeactivating(true)
    const res = await fetch(`/api/admin/restaurants/${data.id}/suspend`, { method: 'POST' })
    const json = await res.json()
    setDeactivating(false)
    if (!res.ok) {
      alert(json.error ?? 'Could not deactivate restaurant')
      return
    }
    setData({ ...data, status: 'suspended' })
    cancelDeactivate()
    setMessage('Restaurant deactivated. Public menu and staff login are offline.')
    router.refresh()
  }

  async function activateRestaurant() {
    const res = await fetch(`/api/admin/restaurants/${data.id}/activate`, { method: 'POST' })
    const json = await res.json()
    if (!res.ok) {
      alert(json.error ?? 'Could not activate restaurant')
      return
    }
    setData({ ...data, status: 'active' })
    setMessage('Restaurant activated.')
    router.refresh()
  }

  async function confirmDelete() {
    if (deleteStep === 0) {
      setDeleteStep(1)
      setDeleteName('')
      return
    }
    if (deleteStep === 1) {
      setDeleteStep(2)
      setDeleteName('')
      return
    }
    if (deleteName.trim() !== data.name) {
      setMessage('')
      return
    }

    setDeleting(true)
    const res = await fetch(`/api/admin/restaurants/${data.id}/delete`, { method: 'POST' })
    const json = await res.json()
    setDeleting(false)
    if (!res.ok) {
      alert(json.error ?? 'Could not delete restaurant')
      return
    }
    router.push('/admin/restaurants')
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

  const statusLabel = data.status === 'suspended' ? 'Deactivated' : data.status

  return (
    <div className="space-y-8">
      <Link href="/admin/restaurants" className="cursor-pointer text-sm text-violet-400">
        ← Back
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{data.name}</h1>
          <p className="mt-1 text-sm capitalize text-slate-400">{statusLabel}</p>
          <a
            href={getOrderUrl(data.slug)}
            target="_blank"
            rel="noreferrer"
            className="cursor-pointer text-xs text-violet-400 hover:underline"
          >
            {getOrderUrl(data.slug)}
          </a>
        </div>
        <Link
          href={`/admin/restaurants/${data.id}/emails`}
          className="cursor-pointer rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
        >
          Email templates
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'overview', label: 'Overview' },
            { id: 'details', label: 'Details' },
            { id: 'branding', label: 'Branding' },
            { id: 'orders', label: 'Orders' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm ${
              tab === item.id ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {message && <p className="text-sm text-emerald-400">{message}</p>}

      {tab === 'overview' && (
        <>
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-4 font-semibold text-white">Quick actions</h2>
            <div className="flex flex-wrap gap-2">
              <ActionBtn
                label="Send invite email"
                onClick={() => setShowInvite(true)}
                active={showInvite}
              />
              <ActionBtn label="Reset password" onClick={toggleResetPassword} active={showResetPassword} />
              <ActionBtn label="Impersonate" onClick={() => action('impersonate')} variant="amber" />
              {data.status === 'active' && (
                <ActionBtn
                  label="Deactivate"
                  onClick={() => {
                    cancelDelete()
                    if (deactivateStep === 0) setDeactivateStep(1)
                  }}
                  variant="warn"
                  active={deactivateStep > 0}
                />
              )}
              {data.status === 'suspended' && (
                <ActionBtn
                  label="Activate"
                  onClick={() => void activateRestaurant()}
                />
              )}
              <ActionBtn
                label="Delete account"
                onClick={() => {
                  cancelDeactivate()
                  if (deleteStep === 0) setDeleteStep(1)
                }}
                variant="danger"
                active={deleteStep > 0}
              />
              {data.email && (
                <a
                  href={`mailto:${data.email}`}
                  className="cursor-pointer rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-300"
                >
                  Contact
                </a>
              )}
            </div>
            {deactivateStep === 1 && (
              <div className="mt-4 rounded-lg border border-orange-900/70 bg-orange-950/40 p-4">
                <p className="text-sm font-medium text-orange-200">Deactivate {data.name}?</p>
                <p className="mt-1 text-sm text-orange-300/80">
                  The public menu will go offline and staff will not be able to sign in.
                  Orders, customers, and branding stay in place so you can activate again later.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={cancelDeactivate}
                    className="cursor-pointer rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void confirmDeactivate()}
                    className="cursor-pointer rounded-lg bg-orange-600 px-3 py-1.5 text-sm text-white"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}
            {deactivateStep === 2 && (
              <div className="mt-4 rounded-lg border border-orange-700 bg-orange-950/60 p-4">
                <p className="text-sm font-medium text-orange-100">Are you sure? The restaurant will go offline.</p>
                <p className="mt-1 text-sm text-orange-300/80">
                  Type <span className="font-medium text-white">{data.name}</span> to confirm deactivation.
                </p>
                <input
                  value={deactivateName}
                  onChange={(e) => setDeactivateName(e.target.value)}
                  autoComplete="off"
                  placeholder={data.name}
                  className="mt-3 w-full rounded-lg border border-orange-800 bg-slate-900 px-3 py-2 text-sm text-white"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={cancelDeactivate}
                    className="cursor-pointer rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-200"
                  >
                    Keep active
                  </button>
                  <button
                    type="button"
                    onClick={() => void confirmDeactivate()}
                    disabled={deactivating || deactivateName.trim() !== data.name}
                    className="cursor-pointer rounded-lg bg-orange-700 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                  >
                    {deactivating ? 'Deactivating...' : 'Yes, deactivate'}
                  </button>
                </div>
              </div>
            )}
            {deleteStep === 1 && (
              <div className="mt-4 rounded-lg border border-red-900/70 bg-red-950/40 p-4">
                <p className="text-sm font-medium text-red-200">Delete {data.name}?</p>
                <p className="mt-1 text-sm text-red-300/80">
                  The public menu will go offline and this restaurant will be hidden from admin lists.
                  Past orders are kept for records.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={cancelDelete}
                    className="cursor-pointer rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void confirmDelete()}
                    className="cursor-pointer rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}
            {deleteStep === 2 && (
              <div className="mt-4 rounded-lg border border-red-700 bg-red-950/60 p-4">
                <p className="text-sm font-medium text-red-100">Are you sure? This cannot be undone.</p>
                <p className="mt-1 text-sm text-red-300/80">
                  Type <span className="font-medium text-white">{data.name}</span> to confirm permanent deletion.
                </p>
                <input
                  value={deleteName}
                  onChange={(e) => setDeleteName(e.target.value)}
                  autoComplete="off"
                  placeholder={data.name}
                  className="mt-3 w-full rounded-lg border border-red-800 bg-slate-900 px-3 py-2 text-sm text-white"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={cancelDelete}
                    className="cursor-pointer rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-200"
                  >
                    Keep account
                  </button>
                  <button
                    type="button"
                    onClick={() => void confirmDelete()}
                    disabled={deleting || deleteName.trim() !== data.name}
                    className="cursor-pointer rounded-lg bg-red-700 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Yes, delete permanently'}
                  </button>
                </div>
              </div>
            )}
            {passwordMessage && !showResetPassword && (
              <p className="mt-3 text-sm text-emerald-400">{passwordMessage}</p>
            )}
            {showResetPassword && (
              <div className="mt-4 border-t border-slate-800 pt-4">
                {data.login_email ? (
                  <p className="text-xs text-slate-500">
                    New dashboard password for {data.login_email}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    No dashboard login yet. Send an invite to create one.
                  </p>
                )}
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <Field
                    label="New password"
                    value={newPassword}
                    onChange={setNewPassword}
                    type="password"
                    autoComplete="new-password"
                  />
                  <Field
                    label="Confirm password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    type="password"
                    autoComplete="new-password"
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={setPassword}
                    disabled={settingPassword || !data.login_email}
                    className="cursor-pointer rounded-lg bg-violet-600 px-4 py-2 text-sm text-white disabled:opacity-50"
                  >
                    {settingPassword ? 'Saving...' : 'Set password'}
                  </button>
                  <button
                    type="button"
                    onClick={toggleResetPassword}
                    className="cursor-pointer px-3 py-2 text-sm text-slate-400"
                  >
                    Cancel
                  </button>
                  {passwordError && <p className="text-sm text-red-400">{passwordError}</p>}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-4 font-semibold text-white">Activity</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <Stat label="Account created" value={new Date(data.created_at).toLocaleDateString('en-GB')} />
              <Stat
                label="Last login"
                value={stats.lastLogin ? new Date(stats.lastLogin).toLocaleString('en-GB') : 'Never'}
              />
              <Stat label="Total orders" value={String(stats.totalOrders)} />
              <Stat label="Orders this month" value={String(stats.ordersThisMonth)} />
              <Stat label="Commission owed" value={formatPence(stats.totalCommissionOwed)} />
              <Stat label="Food commission" value={formatPence(stats.commissionThisMonth)} />
              <Stat label="Service fees" value={formatPence(stats.serviceFeesThisMonth)} />
              <Stat label="Platform this month" value={formatPence(stats.totalPlatformThisMonth)} />
            </dl>
            <div className="mt-6 grid gap-3 text-sm text-slate-300 md:grid-cols-3">
              <p>
                <span className="text-slate-500">Contact</span>
                <br />
                {data.contact_name || data.email || '—'}
              </p>
              <p>
                <span className="text-slate-500">Plan</span>
                <br />
                {data.pricing_plan} · {data.commission_pct}%
              </p>
              <p>
                <span className="text-slate-500">Stripe</span>
                <br />
                {data.stripe_charges_enabled
                  ? 'Ready'
                  : data.stripe_account_id
                    ? 'Onboarding unfinished'
                    : 'Not connected'}
              </p>
            </div>
          </section>
        </>
      )}

      {tab === 'details' && (
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-white">Restaurant details</h2>
          <button
            type="button"
            onClick={saveAll}
            disabled={saving}
            className="cursor-pointer rounded-lg bg-violet-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save details'}
          </button>
        </div>
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
            <label className="text-xs text-slate-400">Stripe Connect</label>
            <p className="mt-1 text-sm text-white">
              {data.stripe_charges_enabled
                ? 'Ready — payments go to the restaurant'
                : data.stripe_account_id
                  ? 'Started — onboarding not finished'
                  : 'Not connected'}
            </p>
            {data.stripe_account_id && (
              <p className="text-xs text-slate-500 mt-1 font-mono break-all">{data.stripe_account_id}</p>
            )}
          </div>
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
      )}

      {tab === 'branding' && (
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-white">Branding</h2>
          <button
            type="button"
            onClick={saveBranding}
            disabled={savingBranding}
            className="cursor-pointer rounded-lg bg-violet-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {savingBranding ? 'Saving...' : 'Save branding'}
          </button>
        </div>
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
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={data.show_powered_by ?? true}
            onChange={(e) => setData({ ...data, show_powered_by: e.target.checked })}
          />
          Show &quot;Powered by Kaji&quot; on menu page
        </label>
      </section>
      )}

      {tab === 'overview' && (
        <>
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
            className="cursor-pointer rounded-lg bg-violet-600 px-3 py-1.5 text-sm text-white"
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

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-white">Recent orders</h2>
          {data.orders.length > 0 && (
            <button
              type="button"
              onClick={() => setTab('orders')}
              className="cursor-pointer text-sm text-violet-400 hover:underline"
            >
              View all orders
            </button>
          )}
        </div>
        <div className="space-y-2">
          {data.orders.slice(0, 8).map((order) => (
            <OrderRow key={order.id} order={order} onRefund={setRefundTarget} />
          ))}
          {data.orders.length === 0 && (
            <p className="text-sm text-slate-500">No orders yet.</p>
          )}
        </div>
      </section>
        </>
      )}

      {tab === 'orders' && (
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-white">Orders</h2>
            <p className="text-sm text-slate-500">
              Showing last {data.orders.length} of {stats.totalOrders}
            </p>
          </div>
          <div className="space-y-2">
            {data.orders.map((order) => (
              <OrderRow key={order.id} order={order} onRefund={setRefundTarget} />
            ))}
            {data.orders.length === 0 && (
              <p className="text-sm text-slate-500">No orders yet.</p>
            )}
          </div>
        </section>
      )}

      {showInvite && (
        <InviteEmailDialog
          restaurantId={data.id}
          restaurantName={data.name}
          onClose={() => setShowInvite(false)}
          onSent={(to) => {
            setShowInvite(false)
            setMessage(`Invite email sent to ${to}`)
            router.refresh()
          }}
        />
      )}

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

function OrderRow({
  order,
  onRefund,
}: {
  order: Order
  onRefund: (order: Order) => void
}) {
  const closed = order.status === 'REFUNDED' || order.status === 'CANCELLED' || order.status === 'REJECTED'
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="flex justify-between gap-4">
        <div>
          <p className="font-medium text-white">{formatOrderNumber(order.order_number)}</p>
          <p className="text-sm text-slate-400">{order.customer_name}</p>
          <p className="mt-1 text-xs text-slate-500">{formatLondonWhen(order.created_at)}</p>
          {order.refund_reason && (
            <p className="mt-1 text-xs text-red-400">Refund: {order.refund_reason}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-white">{formatPence(order.total_pence)}</p>
          <p className={`text-xs ${closed ? 'text-red-400' : 'text-slate-500'}`}>{order.status}</p>
        </div>
      </div>
      {canRefundOrder(order.status, order.stripe_payment_status as never) && (
        <button
          type="button"
          onClick={() => onRefund(order)}
          className="mt-3 cursor-pointer rounded-lg bg-red-600/20 px-3 py-1.5 text-sm text-red-400 hover:bg-red-600/30"
        >
          Refund
        </button>
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
  active = false,
}: {
  label: string
  onClick: () => void
  variant?: 'default' | 'amber' | 'warn' | 'danger'
  active?: boolean
}) {
  const styles = {
    default: 'bg-slate-800 text-slate-200 hover:bg-slate-700',
    amber: 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/30',
    warn: 'bg-orange-600/20 text-orange-400 hover:bg-orange-600/30',
    danger: 'bg-red-600/20 text-red-400 hover:bg-red-600/30',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm ${active ? 'bg-violet-600 text-white' : styles[variant]}`}
    >
      {label}
    </button>
  )
}
