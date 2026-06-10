'use client'

import { useCallback, useEffect, useState } from 'react'

type Coupon = {
  id: string
  code: string
  uses_count: number
  max_uses: number | null
  active: boolean
}

type Promotion = {
  id: string
  name: string
  description: string | null
  promo_type: string
  discount_pct: number | null
  discount_pence: number | null
  applies_to: string
  min_order_pence: number | null
  badge_text: string | null
  badge_color: string | null
  show_on_menu: boolean
  active: boolean
  uses_count: number
  max_uses: number | null
  valid_from: string | null
  valid_until: string | null
  coupon_codes: Coupon[]
  _count?: { order_discounts: number }
}

const PROMO_TYPES = [
  { value: 'PERCENTAGE_OFF', label: '% Off' },
  { value: 'FIXED_OFF', label: '£ Off' },
  { value: 'BUY_X_GET_Y', label: 'Buy X Get Y' },
  { value: 'BUNDLE', label: 'Bundle' },
  { value: 'FREE_ITEM', label: 'Free Item' },
  { value: 'HAPPY_HOUR', label: 'Happy Hour' },
] as const

const emptyForm = {
  name: '',
  description: '',
  promo_type: 'PERCENTAGE_OFF',
  discount_pct: 10,
  discount_pence: 500,
  applies_to: 'order',
  min_order_pence: 0,
  badge_text: '',
  badge_color: '#ef4444',
  show_on_menu: true,
  require_coupon: false,
  coupon_code: '',
  max_uses: '',
}

export function PromotionsManager() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/dashboard/promotions')
    if (res.ok) {
      const data = await res.json()
      setPromotions(data.promotions)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch('/api/dashboard/promotions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        description: form.description || null,
        promo_type: form.promo_type,
        discount_pct: form.promo_type === 'PERCENTAGE_OFF' || form.promo_type === 'HAPPY_HOUR' ? form.discount_pct : null,
        discount_pence: form.promo_type === 'FIXED_OFF' ? form.discount_pence : null,
        applies_to: form.applies_to,
        min_order_pence: form.min_order_pence > 0 ? form.min_order_pence : null,
        badge_text: form.badge_text || form.name,
        badge_color: form.badge_color,
        show_on_menu: form.show_on_menu,
        coupon_codes: form.require_coupon && form.coupon_code ? [form.coupon_code] : [],
      }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(data.error ?? 'Failed to create promotion')
      return
    }

    setShowForm(false)
    setForm(emptyForm)
    load()
  }

  async function toggleActive(promo: Promotion) {
    await fetch(`/api/dashboard/promotions/${promo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !promo.active }),
    })
    load()
  }

  async function deletePromo(id: string) {
    if (!confirm('Delete this promotion?')) return
    await fetch(`/api/dashboard/promotions/${id}`, { method: 'DELETE' })
    load()
  }

  if (loading) {
    return <p className="text-slate-400">Loading promotions...</p>
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => setShowForm(!showForm)}
        className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium"
      >
        {showForm ? 'Cancel' : '+ Create promotion'}
      </button>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 max-w-xl">
          <h2 className="font-semibold text-white">New promotion</h2>

          <div className="flex flex-wrap gap-2">
            {PROMO_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm({ ...form, promo_type: t.value })}
                className={`px-3 py-1.5 rounded-lg text-xs ${
                  form.promo_type === t.value ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <input
            required
            placeholder="Promotion name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
          />
          <textarea
            placeholder="Description (shown to customer)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            rows={2}
          />

          {(form.promo_type === 'PERCENTAGE_OFF' || form.promo_type === 'HAPPY_HOUR') && (
            <input
              type="number"
              min={1}
              max={100}
              placeholder="Discount %"
              value={form.discount_pct}
              onChange={(e) => setForm({ ...form, discount_pct: Number(e.target.value) })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          )}
          {form.promo_type === 'FIXED_OFF' && (
            <input
              type="number"
              min={1}
              placeholder="Discount (pence)"
              value={form.discount_pence}
              onChange={(e) => setForm({ ...form, discount_pence: Number(e.target.value) })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          )}

          <input
            type="number"
            min={0}
            placeholder="Minimum order (pence, optional)"
            value={form.min_order_pence || ''}
            onChange={(e) => setForm({ ...form, min_order_pence: Number(e.target.value) || 0 })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
          />

          <input
            placeholder="Badge text (menu)"
            value={form.badge_text}
            onChange={(e) => setForm({ ...form, badge_text: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
          />
          <input
            type="color"
            value={form.badge_color}
            onChange={(e) => setForm({ ...form, badge_color: e.target.value })}
            className="h-10 w-20 rounded"
          />

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.require_coupon}
              onChange={(e) => setForm({ ...form, require_coupon: e.target.checked })}
            />
            Require coupon code
          </label>
          {form.require_coupon && (
            <input
              placeholder="Coupon code e.g. SAVE10"
              value={form.coupon_code}
              onChange={(e) => setForm({ ...form, coupon_code: e.target.value.toUpperCase() })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-mono"
            />
          )}

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.show_on_menu}
              onChange={(e) => setForm({ ...form, show_on_menu: e.target.checked })}
            />
            Show on menu
          </label>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save promotion'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {promotions.length === 0 && (
          <p className="text-slate-500 text-sm">No promotions yet.</p>
        )}
        {promotions.map((promo) => (
          <div
            key={promo.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-start justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-xs px-2 py-0.5 rounded text-white"
                  style={{ backgroundColor: promo.badge_color ?? '#64748b' }}
                >
                  {promo.promo_type.replace(/_/g, ' ')}
                </span>
                {!promo.active && (
                  <span className="text-xs text-slate-500">Paused</span>
                )}
              </div>
              <h3 className="font-semibold text-white mt-2">{promo.name}</h3>
              {promo.description && (
                <p className="text-sm text-slate-400 mt-1">{promo.description}</p>
              )}
              <p className="text-xs text-slate-500 mt-2">
                Used {promo.uses_count} times
                {promo._count ? ` · ${promo._count.order_discounts} orders` : ''}
                {promo.coupon_codes.length > 0 &&
                  ` · Codes: ${promo.coupon_codes.map((c) => c.code).join(', ')}`}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toggleActive(promo)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
              >
                {promo.active ? 'Pause' : 'Resume'}
              </button>
              <button
                type="button"
                onClick={() => deletePromo(promo.id)}
                className="px-3 py-1.5 bg-red-900/40 text-red-300 rounded-lg text-xs"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
