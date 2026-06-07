'use client'

import { useState } from 'react'

export function AdminSettingsClient({
  initial,
}: {
  initial: { registration_mode: string; show_commission: boolean }
}) {
  const [mode, setMode] = useState(initial.registration_mode)
  const [showCommission, setShowCommission] = useState(initial.show_commission)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save(nextMode: string) {
    setSaving(true)
    setSaved(false)
    setMode(nextMode)

    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        registration_mode: nextMode,
        show_commission: showCommission,
      }),
    })

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
            onClick={() => save('request')}
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
            onClick={() => save('self_serve')}
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
        <h2 className="font-semibold text-white mb-1">Commission visibility</h2>
        <label className="flex items-center gap-2 text-sm text-slate-300 mt-3">
          <input
            type="checkbox"
            checked={showCommission}
            onChange={async (e) => {
              const val = e.target.checked
              setShowCommission(val)
              await fetch('/api/admin/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ show_commission: val, registration_mode: mode }),
              })
            }}
          />
          Show commission % on public pages (not recommended)
        </label>
      </div>
    </div>
  )
}
