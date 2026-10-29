'use client'

import { useEffect, useState } from 'react'
import { PhotoUpload } from '@/app/components/PhotoUpload'
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
  show_menu_images: boolean
  min_order_pence: number
  avg_prep_minutes: number
  order_mode: string
  acceptance_timer_mins: number
  auto_accept_orders: boolean
  auto_accept_delay_minutes: number
  accept_timeout_minutes: number
  email_notifications: boolean
  sound_alerts: boolean
}

const TAB_LABELS = ['Profile', 'Branding', 'Hours', 'Ordering', 'Notifications', 'Share'] as const
const PREP_TIME_OPTIONS = [10, 15, 20, 25, 30, 45] as const

export function SettingsClient({ initial }: { initial: Restaurant }) {
  const [tab, setTab] = useState<(typeof TAB_LABELS)[number]>('Profile')
  const [data, setData] = useState({
    ...initial,
    primary_color: initial.primary_color ?? initial.brand_color ?? DEFAULT_PRIMARY,
    font_choice: initial.font_choice ?? 'default',
  })
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deliveryZone, setDeliveryZone] = useState<{
    radius_km: number
    delivery_fee_pence: number
    minimum_order_pence: number
    delivery_from: string
    delivery_until: string
  } | null>(null)

  useEffect(() => {
    fetch('/api/restaurant/delivery')
      .then((r) => r.json())
      .then((json) => {
        if (json.zone) {
          setDeliveryZone({
            radius_km: json.zone.radius_km,
            delivery_fee_pence: json.zone.delivery_fee_pence,
            minimum_order_pence: json.zone.minimum_order_pence,
            delivery_from: json.zone.delivery_from ?? '17:00',
            delivery_until: json.zone.delivery_until ?? '',
          })
        }
      })
      .catch(() => {})
  }, [])

  async function saveDeliveryZone(patch: Partial<{
    radius_km: number
    delivery_fee_pence: number
    minimum_order_pence: number
    delivery_from: string
    delivery_until: string
  }>) {
    const next = {
      radius_km: patch.radius_km ?? deliveryZone?.radius_km ?? 5,
      delivery_fee_pence: patch.delivery_fee_pence ?? deliveryZone?.delivery_fee_pence ?? 299,
      minimum_order_pence:
        patch.minimum_order_pence ?? deliveryZone?.minimum_order_pence ?? 0,
      delivery_from: patch.delivery_from ?? deliveryZone?.delivery_from ?? '17:00',
      delivery_until: patch.delivery_until ?? deliveryZone?.delivery_until ?? '',
    }
    setDeliveryZone(next)
    setSaving(true)
    const res = await fetch('/api/restaurant/delivery', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...next,
        delivery_until: next.delivery_until || null,
      }),
    })
    const json = await res.json()
    if (json.zone) {
      setDeliveryZone({
        radius_km: json.zone.radius_km,
        delivery_fee_pence: json.zone.delivery_fee_pence,
        minimum_order_pence: json.zone.minimum_order_pence,
        delivery_from: json.zone.delivery_from ?? '17:00',
        delivery_until: json.zone.delivery_until ?? '',
      })
    }
    setSaving(false)
  }

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
              <PhotoUpload
                value={data.logo_url ?? ''}
                onChange={(url) => setData({ ...data, logo_url: url || null })}
                kind="logo"
                label="Upload logo"
              />
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
            <div className="mt-2">
              <PhotoUpload
                value={data.banner_url ?? ''}
                onChange={(url) => setData({ ...data, banner_url: url || null })}
                kind="banner"
                label="Upload banner"
              />
            </div>
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
          <Toggle
            label="Collection enabled"
            checked={data.collection_enabled}
            onChange={(v) => {
              if (!v && !data.delivery_enabled) return
              save({ collection_enabled: v })
            }}
          />
          <Toggle
            label="Delivery enabled"
            checked={data.delivery_enabled}
            onChange={(v) => {
              if (!v && !data.collection_enabled) return
              save({ delivery_enabled: v })
            }}
          />
          <p className="text-xs text-slate-500 -mt-2">
            At least one of collection or delivery must stay enabled.
          </p>

          {data.delivery_enabled && (
            <div className="border border-slate-800 rounded-lg p-4 space-y-4 bg-slate-900/50">
              <p className="text-sm font-medium text-white">Delivery area</p>
              <p className="text-xs text-slate-500">
                Set your restaurant postcode in Profile for radius checks. Postcodes are verified via postcodes.io.
              </p>
              {deliveryZone ? (
                <>
                  <Field
                    label="Delivery radius (km)"
                    value={String(deliveryZone.radius_km)}
                    onChange={(v) =>
                      setDeliveryZone({ ...deliveryZone, radius_km: parseFloat(v) || 5 })
                    }
                  />
                  <Field
                    label="Delivery fee (£)"
                    value={String((deliveryZone.delivery_fee_pence / 100).toFixed(2))}
                    onChange={(v) =>
                      setDeliveryZone({
                        ...deliveryZone,
                        delivery_fee_pence: Math.round(parseFloat(v || '0') * 100),
                      })
                    }
                  />
                  <Field
                    label="Minimum order for delivery (£)"
                    value={String((deliveryZone.minimum_order_pence / 100).toFixed(2))}
                    onChange={(v) =>
                      setDeliveryZone({
                        ...deliveryZone,
                        minimum_order_pence: Math.round(parseFloat(v || '0') * 100),
                      })
                    }
                  />
                  <div>
                    <label className="text-xs text-slate-400">Delivery available from</label>
                    <input
                      type="time"
                      value={deliveryZone.delivery_from}
                      onChange={(e) =>
                        setDeliveryZone({ ...deliveryZone, delivery_from: e.target.value })
                      }
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Delivery available until (optional)</label>
                    <input
                      type="time"
                      value={deliveryZone.delivery_until}
                      onChange={(e) =>
                        setDeliveryZone({ ...deliveryZone, delivery_until: e.target.value })
                      }
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                    />
                  </div>
                  <SaveBtn
                    saving={saving}
                    onClick={() =>
                      saveDeliveryZone({
                        radius_km: deliveryZone.radius_km,
                        delivery_fee_pence: deliveryZone.delivery_fee_pence,
                        minimum_order_pence: deliveryZone.minimum_order_pence,
                        delivery_from: deliveryZone.delivery_from,
                        delivery_until: deliveryZone.delivery_until,
                      })
                    }
                  />
                </>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    saveDeliveryZone({
                      radius_km: 5,
                      delivery_fee_pence: 299,
                      minimum_order_pence: 0,
                      delivery_from: '17:00',
                      delivery_until: '',
                    })
                  }
                  className="text-sm text-violet-400 hover:text-violet-300"
                >
                  Set up delivery zone
                </button>
              )}
            </div>
          )}

          <div className="border-t border-slate-800 pt-4 space-y-4">
            <p className="text-sm font-medium text-white">When closed</p>
            <Toggle
              label="Show menu when closed"
              checked={data.show_menu_when_closed}
              onChange={(v) => save({ show_menu_when_closed: v })}
            />
            <p className="text-xs text-slate-500 -mt-2">
              On: customers can browse the menu with a Closed badge. Off: they only see a closed page.
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

          <div className="border-t border-slate-800 pt-4 space-y-3">
            <p className="text-sm font-medium text-white">Order acceptance mode</p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="order_mode"
                checked={data.order_mode === 'instant'}
                onChange={() => setData({ ...data, order_mode: 'instant' })}
                className="mt-1"
              />
              <span>
                <span className="text-sm text-white block">Confirm orders automatically</span>
                <span className="text-xs text-slate-500">Orders confirmed immediately after payment</span>
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="order_mode"
                checked={data.order_mode === 'manual'}
                onChange={() => setData({ ...data, order_mode: 'manual' })}
                className="mt-1"
              />
              <span>
                <span className="text-sm text-white block">Manually accept each order</span>
                <span className="text-xs text-slate-500">You review each order before confirming</span>
              </span>
            </label>
            {data.order_mode === 'instant' && (
              <div className="space-y-3 pt-2">
                <div>
                  <p className="text-sm font-medium text-white">Default preparation time</p>
                  <p className="text-xs text-slate-500">Used when orders are auto-confirmed</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PREP_TIME_OPTIONS.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setData({ ...data, avg_prep_minutes: mins })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        data.avg_prep_minutes === mins
                          ? 'bg-violet-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {mins}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-xs text-slate-400">Custom (minutes)</label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={data.avg_prep_minutes}
                    onChange={(e) =>
                      setData({
                        ...data,
                        avg_prep_minutes: Math.min(120, Math.max(5, parseInt(e.target.value, 10) || 30)),
                      })
                    }
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>
            )}
            {data.order_mode === 'manual' && (
              <Field
                label="Acceptance timer (mins)"
                value={String(data.acceptance_timer_mins)}
                onChange={(v) =>
                  setData({
                    ...data,
                    acceptance_timer_mins: Math.min(15, Math.max(1, parseInt(v || '3', 10))),
                  })
                }
              />
            )}
          </div>

          <SaveBtn saving={saving} onClick={() => save({
            min_order_pence: data.min_order_pence,
            avg_prep_minutes: data.avg_prep_minutes,
            order_mode: data.order_mode,
            acceptance_timer_mins: data.acceptance_timer_mins,
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
