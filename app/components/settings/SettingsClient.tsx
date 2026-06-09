'use client'

import { useState } from 'react'
import { DAYS, type DayHours, type OpeningHours, getOrderUrl } from '@/app/lib/utils'
import { parseOpeningHours } from '@/app/lib/hours'
import {
  DEFAULT_PRIMARY,
  FONT_OPTIONS,
  getFontPreviewClass,
  isPaidPlan,
} from '@/app/lib/branding'

type Restaurant = {
  id: string
  name: string
  slug: string
  address?: string | null
  postcode?: string | null
  phone?: string | null
  logo_url?: string | null
  banner_url?: string | null
  description?: string | null
  brand_color: string
  primary_color?: string | null
  secondary_color?: string | null
  font_choice?: string | null
  show_powered_by: boolean
  pricing_plan: string
  opening_hours?: unknown
  holiday_mode: boolean
  holiday_message?: string | null
  collection_enabled: boolean
  accept_preorders: boolean
  preorder_days_ahead: number
  show_menu_when_closed: boolean
  delivery_enabled: boolean
  min_order_pence: number
  avg_prep_minutes: number
  auto_accept_orders: boolean
  auto_accept_delay_minutes: number
  accept_timeout_minutes: number
  email_notifications: boolean
  sound_alerts: boolean
}

const TAB_LABELS = ['Profile', 'Branding', 'Hours', 'Ordering', 'Notifications', 'Share'] as const

export function SettingsClient({ initial }: { initial: Restaurant }) {
  const [tab, setTab] = useState<(typeof TAB_LABELS)[number]>('Profile')
  const [data, setData] = useState({
    ...initial,
    primary_color: initial.primary_color ?? initial.brand_color ?? DEFAULT_PRIMARY,
    font_choice: initial.font_choice ?? 'default',
  })
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const orderUrl = getOrderUrl(data.slug)
  const primaryColor = data.primary_color ?? DEFAULT_PRIMARY
  const showPoweredByToggle = !isPaidPlan(data.pricing_plan)

  async function save(partial: Partial<Restaurant>) {
    setSaving(true)
    const res = await fetch('/api/restaurant/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    })
    const json = await res.json()
    if (json.restaurant) setData(json.restaurant)
    setSaving(false)
  }

  const hours = parseOpeningHours(data.opening_hours)

  function updateHours(day: string, patch: Partial<DayHours>) {
    const updated = { ...hours, [day]: { ...hours[day as keyof OpeningHours], ...patch } }
    save({ opening_hours: updated })
  }

  function playTestSound() {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      osc.connect(ctx.destination)
      osc.frequency.value = 660
      osc.start()
      setTimeout(() => { osc.stop(); ctx.close() }, 300)
    } catch { /* ignore */ }
  }

  function copyLink() {
    navigator.clipboard.writeText(orderUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(orderUrl)}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Order online: ${orderUrl}`)}`

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-4">Settings</h1>
      <div className="flex gap-2 flex-wrap mb-6">
        {TAB_LABELS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm ${tab === t ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Profile' && (
        <div className="space-y-4 max-w-lg">
          <Field label="Restaurant name" value={data.name} onChange={(v) => setData({ ...data, name: v })} />
          <Field label="Slug" value={data.slug} onChange={(v) => setData({ ...data, slug: v })} />
          <Field label="Address" value={data.address ?? ''} onChange={(v) => setData({ ...data, address: v })} />
          <Field label="Postcode" value={data.postcode ?? ''} onChange={(v) => setData({ ...data, postcode: v })} />
          <Field label="Phone" value={data.phone ?? ''} onChange={(v) => setData({ ...data, phone: v })} />
          <Field label="Description" value={data.description ?? ''} onChange={(v) => setData({ ...data, description: v })} multiline />
          <SaveBtn saving={saving} onClick={() => save(data)} />
        </div>
      )}

      {tab === 'Branding' && (
        <div className="space-y-6 max-w-lg">
          <div>
            <label className="text-sm text-slate-400">Brand colour</label>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setData({ ...data, primary_color: e.target.value })}
                className="h-10 w-14 cursor-pointer rounded border border-slate-700 bg-slate-800"
              />
              <input
                value={primaryColor}
                onChange={(e) => setData({ ...data, primary_color: e.target.value })}
                className="w-28 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-mono"
              />
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Preview button
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400">Logo</label>
            <div className="mt-2 flex items-center gap-4">
              {data.logo_url ? (
                <img src={data.logo_url} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-slate-700" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-slate-500 text-xs">
                  No logo
                </div>
              )}
              <div className="flex-1">
                <input
                  value={data.logo_url ?? ''}
                  onChange={(e) => setData({ ...data, logo_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">Enter a direct image URL</p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400">Banner</label>
            {data.banner_url ? (
              <img src={data.banner_url} alt="" className="mt-2 h-[200px] w-full rounded-xl object-cover" />
            ) : (
              <div
                className="mt-2 flex h-[200px] w-full items-center justify-center rounded-xl text-sm text-white/80"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}99)` }}
              >
                Banner preview
              </div>
            )}
            <input
              value={data.banner_url ?? ''}
              onChange={(e) => setData({ ...data, banner_url: e.target.value })}
              placeholder="https://..."
              className="w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">Enter a direct image URL</p>
          </div>

          <div>
            <label className="text-sm text-slate-400">Font</label>
            <select
              value={data.font_choice ?? 'default'}
              onChange={(e) => setData({ ...data, font_choice: e.target.value })}
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <p className={`mt-3 text-white ${getFontPreviewClass(data.font_choice)}`}>
              {data.name} — menu preview text
            </p>
          </div>

          {showPoweredByToggle ? (
            <Toggle
              label={'Show "Powered by Kaji" on menu page'}
              checked={data.show_powered_by}
              onChange={(v) => setData({ ...data, show_powered_by: v })}
            />
          ) : (
            <p className="text-sm text-slate-500">
              &quot;Powered by Kaji&quot; is hidden on your plan.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <SaveBtn
              saving={saving}
              onClick={() =>
                save({
                  primary_color: data.primary_color,
                  logo_url: data.logo_url,
                  banner_url: data.banner_url,
                  font_choice: data.font_choice,
                  show_powered_by: data.show_powered_by,
                })
              }
            />
            <a
              href={orderUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700"
            >
              Preview my menu page →
            </a>
          </div>
        </div>
      )}

      {tab === 'Hours' && (
        <div className="space-y-4 max-w-lg">
          {DAYS.map((day) => (
            <div key={day} className="flex flex-wrap items-center gap-3 bg-slate-900 border border-slate-800 rounded-lg p-3">
              <span className="w-24 capitalize text-white text-sm">{day}</span>
              <label className="flex items-center gap-1 text-sm text-slate-400">
                <input type="checkbox" checked={hours[day].open} onChange={(e) => updateHours(day, { open: e.target.checked })} />
                Open
              </label>
              <input type="time" value={hours[day].openTime} onChange={(e) => updateHours(day, { openTime: e.target.value })} className="bg-slate-800 rounded px-2 py-1 text-white text-sm" />
              <span className="text-slate-500">–</span>
              <input type="time" value={hours[day].closeTime} onChange={(e) => updateHours(day, { closeTime: e.target.value })} className="bg-slate-800 rounded px-2 py-1 text-white text-sm" />
            </div>
          ))}
          <label className="flex items-center gap-2 text-white">
            <input type="checkbox" checked={data.holiday_mode} onChange={(e) => save({ holiday_mode: e.target.checked })} />
            Holiday mode
          </label>
          <Field label="Holiday message" value={data.holiday_message ?? ''} onChange={(v) => setData({ ...data, holiday_message: v })} />
          <SaveBtn saving={saving} onClick={() => save({ holiday_message: data.holiday_message })} />
        </div>
      )}

      {tab === 'Ordering' && (
        <div className="space-y-4 max-w-lg">
          <Toggle label="Collection enabled" checked={data.collection_enabled} onChange={(v) => save({ collection_enabled: v })} />
          <Toggle label="Delivery enabled (Phase 2)" checked={data.delivery_enabled} onChange={(v) => save({ delivery_enabled: v })} disabled />

          <div className="border-t border-slate-800 pt-4 space-y-4">
            <p className="text-sm font-medium text-white">When closed</p>
            <Toggle
              label="Show menu when closed"
              checked={data.show_menu_when_closed}
              onChange={(v) => save({ show_menu_when_closed: v })}
            />
            <p className="text-xs text-slate-500 -mt-2">
              Off: customers see a closed page only. On: menu remains visible.
            </p>
            <Toggle
              label="Accept pre-orders"
              checked={data.accept_preorders}
              onChange={(v) => save({ accept_preorders: v })}
            />
            <p className="text-xs text-slate-500 -mt-2">
              On: customers can order outside opening hours. Orders are queued for when you open.
            </p>
            {data.accept_preorders && (
              <div>
                <label className="text-xs text-slate-400">Accept orders up to (days in advance)</label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={data.preorder_days_ahead}
                  onChange={(e) =>
                    setData({
                      ...data,
                      preorder_days_ahead: Math.min(7, Math.max(1, parseInt(e.target.value, 10) || 1)),
                    })
                  }
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
            )}
          </div>

          <Field label="Min order (£)" value={String(data.min_order_pence / 100)} onChange={(v) => setData({ ...data, min_order_pence: Math.round(parseFloat(v || '0') * 100) })} />
          <Field label="Avg prep time (mins)" value={String(data.avg_prep_minutes)} onChange={(v) => setData({ ...data, avg_prep_minutes: parseInt(v || '30', 10) })} />
          <Toggle label="Auto-accept orders" checked={data.auto_accept_orders} onChange={(v) => save({ auto_accept_orders: v })} />
          <Field label="Auto-accept delay (mins)" value={String(data.auto_accept_delay_minutes)} onChange={(v) => setData({ ...data, auto_accept_delay_minutes: parseInt(v || '5', 10) })} />
          <Field label="Accept timeout (mins)" value={String(data.accept_timeout_minutes)} onChange={(v) => setData({ ...data, accept_timeout_minutes: parseInt(v || '10', 10) })} />
          <SaveBtn saving={saving} onClick={() => save({
            min_order_pence: data.min_order_pence,
            avg_prep_minutes: data.avg_prep_minutes,
            auto_accept_delay_minutes: data.auto_accept_delay_minutes,
            accept_timeout_minutes: data.accept_timeout_minutes,
            accept_preorders: data.accept_preorders,
            preorder_days_ahead: data.preorder_days_ahead,
            show_menu_when_closed: data.show_menu_when_closed,
          })} />
        </div>
      )}

      {tab === 'Notifications' && (
        <div className="space-y-4 max-w-lg">
          <Toggle label="Email notifications" checked={data.email_notifications} onChange={(v) => save({ email_notifications: v })} />
          <Toggle label="Sound alerts" checked={data.sound_alerts} onChange={(v) => save({ sound_alerts: v })} />
          <button type="button" onClick={playTestSound} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm">
            Test sound
          </button>
        </div>
      )}

      {tab === 'Share' && (
        <div className="space-y-6 max-w-lg">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="font-semibold text-white mb-2">Your ordering link</h2>
            <p className="text-violet-400 break-all text-sm mb-4">{orderUrl}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={copyLink} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm">
                {copied ? 'Copied!' : 'Copy link'}
              </button>
              <a href={orderUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm">
                Open page
              </a>
              <a href={qrUrl} download={`${data.slug}-qr.png`} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm">
                Download QR code
              </a>
            </div>
            <img src={qrUrl} alt="QR code" className="mt-4 w-[150px] h-[150px] rounded-lg bg-white p-2" />
          </div>
          <div className="space-y-2">
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="block text-violet-400 text-sm hover:underline">
              Share on WhatsApp
            </a>
            <button type="button" onClick={() => navigator.clipboard.writeText(orderUrl)} className="block text-violet-400 text-sm hover:underline text-left">
              Copy for Instagram bio
            </button>
            <p className="text-sm text-slate-500">
              Add to Google My Business: paste your ordering link in the Website or Menu URL field on your business profile.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <div>
      <label className="text-sm text-slate-400">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white" />
      )}
    </div>
  )
}

function Toggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`flex items-center gap-2 text-white ${disabled ? 'opacity-50' : ''}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}

function SaveBtn({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={saving} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm disabled:opacity-50">
      {saving ? 'Saving...' : 'Save changes'}
    </button>
  )
}
