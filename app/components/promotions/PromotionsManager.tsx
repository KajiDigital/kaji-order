'use client'

import { useCallback, useEffect, useState } from 'react'
import { buildPromotionPreview } from '@/app/lib/promotion-config'
import {
  PromotionForm,
  buildPayloadFromForm,
  emptyPromotionForm,
  usePromotionMenuData,
  type PromotionFormState,
} from './PromotionForm'

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

export function PromotionsManager() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<PromotionFormState>(emptyPromotionForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const categories = usePromotionMenuData()

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
      body: JSON.stringify(buildPayloadFromForm(form)),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(data.error ?? 'Failed to create promotion')
      return
    }

    setShowForm(false)
    setForm(emptyPromotionForm())
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
        onClick={() => {
          setShowForm(!showForm)
          if (showForm) setForm(emptyPromotionForm())
        }}
        className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium"
      >
        {showForm ? 'Cancel' : '+ Create promotion'}
      </button>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 max-w-2xl"
        >
          <h2 className="font-semibold text-white">New promotion</h2>
          <PromotionForm form={form} setForm={setForm} categories={categories} />
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
        {promotions.map((promo) => {
          const preview = buildPromotionPreview(
            {
              promo_type: promo.promo_type,
              discount_pct: promo.discount_pct,
              discount_pence: promo.discount_pence,
              buy_quantity: null,
              get_quantity: null,
              applies_to: promo.applies_to,
              min_order_pence: promo.min_order_pence,
              days_of_week: null,
              time_from: null,
              time_until: null,
              name: promo.name,
              badge_text: promo.badge_text,
            },
            { categories }
          )
          return (
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
                  {!promo.active && <span className="text-xs text-slate-500">Paused</span>}
                </div>
                <h3 className="font-semibold text-white mt-2">{promo.name}</h3>
                <p className="text-sm text-slate-400 mt-1">{preview.summary}</p>
                {promo.description && (
                  <p className="text-sm text-slate-500 mt-1">{promo.description}</p>
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
          )
        })}
      </div>
    </div>
  )
}
