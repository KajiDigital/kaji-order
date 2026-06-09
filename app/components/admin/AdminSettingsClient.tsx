'use client'

import { useState } from 'react'
import { formatPence } from '@/app/lib/utils'

export function AdminSettingsClient({
  initial,
}: {
  initial: { registration_mode: string; show_commission: boolean; service_fee_pence: number }
}) {
  const [mode, setMode] = useState(initial.registration_mode)
  const [showCommission, setShowCommission] = useState(initial.show_commission)
  const [serviceFeePence, setServiceFeePence] = useState(initial.service_fee_pence)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function saveSettings(updates: {
    registration_mode?: string
    show_commission?: boolean
    service_fee_pence?: number
  }) {
    setSaving(true)
    setSaved(false)

    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        registration_mode: updates.registration_mode ?? mode,
        show_commission: updates.show_commission ?? showCommission,
        service_fee_pence: updates.service_fee_pence ?? serviceFeePence,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      setMode(data.settings.registration_mode)
      setShowCommission(data.settings.show_commission)
      setServiceFeePence(data.settings.service_fee_pence)
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function saveMode(nextMode: string) {
    setMode(nextMode)
    await saveSettings({ registration_mode: nextMode })
  }

  return (
    <div className="space-y-8 max-w-xl">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="font-semibold text-white mb-1">Registration mode</h2>
        <p className="text-sm text-slate-400 mb-4">
          Control how new restaurants can join the platform.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => saveMode('request')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium ${
              mode === 'request'
                ? 'bg-violet-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Request only
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => saveMode('self_serve')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium ${
              mode === 'self_serve'
                ? 'bg-violet-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Self-serve
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          {mode === 'request'
            ? 'Customers submit a request form. You approve before they get access.'
            : 'Restaurants register instantly with the full 3-step flow.'}
        </p>
        {saved && <p className="text-emerald-400 text-sm mt-2">Saved</p>}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="font-semibold text-white mb-1">Service fee</h2>
        <p className="text-sm text-slate-400 mb-4">
          Flat fee added to every customer order at checkout. Kept by the platform (not the restaurant).
        </p>
        <label className="text-xs text-slate-400">Service fee (pence)</label>
        <div className="mt-1 flex items-center gap-3">
          <input
            type="number"
            min={0}
            max={999}
            value={serviceFeePence}
            onChange={(e) => setServiceFeePence(parseInt(e.target.value, 10) || 0)}
            className="w-28 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
          />
          <span className="text-sm text-slate-400">{formatPence(serviceFeePence)}</span>
          <button
            type="button"
            disabled={saving}
            onClick={() => saveSettings({ service_fee_pence: serviceFeePence })}
            className="px-3 py-2 bg-violet-600 text-white rounded-lg text-sm disabled:opacity-50"
          >
            Save
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Default is 49p (£0.49). Commission is calculated on food subtotal only.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="font-semibold text-white mb-1">Commission visibility</h2>
        <label className="flex items-center gap-2 text-sm text-slate-300 mt-3">
          <input
            type="checkbox"
            checked={showCommission}
            onChange={async (e) => {
              const val = e.target.checked
              setShowCommission(val)
              await saveSettings({ show_commission: val })
            }}
          />
          Show commission % on public pages (not recommended)
        </label>
      </div>
    </div>
  )
}
