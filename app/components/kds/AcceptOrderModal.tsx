'use client'

import { useEffect, useState } from 'react'
import { formatOrderNumber, formatReadyAtTime } from '@/app/lib/utils'

const PREP_OPTIONS = [10, 15, 20, 25, 30, 45]

export function AcceptOrderModal({
  orderNumber,
  defaultPrepMins,
  onCancel,
  onAccept,
}: {
  orderNumber: number
  defaultPrepMins: number
  onCancel: () => void
  onAccept: (prepTimeMins: number) => Promise<void>
}) {
  const [prepMins, setPrepMins] = useState(defaultPrepMins)
  const [custom, setCustom] = useState('')
  const [saving, setSaving] = useState(false)

  const activeMins = custom ? parseInt(custom, 10) || defaultPrepMins : prepMins
  const readyPreview = formatReadyAtTime(
    new Date(Date.now() + activeMins * 60_000)
  )

  async function handleAccept() {
    setSaving(true)
    await onAccept(activeMins)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white">
          Accept Order {formatOrderNumber(orderNumber)}
        </h2>
        <p className="text-sm text-slate-400 mt-1">How long until ready?</p>

        <div className="flex flex-wrap gap-2 mt-4">
          {PREP_OPTIONS.map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => {
                setPrepMins(mins)
                setCustom('')
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                !custom && prepMins === mins
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {mins} mins
            </button>
          ))}
        </div>

        <div className="mt-4">
          <label className="text-xs text-slate-400">Custom (minutes)</label>
          <input
            type="number"
            min={5}
            max={120}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder={String(defaultPrepMins)}
            className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
          />
        </div>

        <p className="text-sm text-emerald-400 mt-4">
          Customer told: Ready at {readyPreview}
        </p>

        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAccept}
            disabled={saving}
            className="flex-1 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Accepting...' : 'Accept & Notify →'}
          </button>
        </div>
      </div>
    </div>
  )
}
