'use client'

import { useMemo, useState } from 'react'
import { formatOrderNumber, formatReadyAtTime, readyAtCustomerLabel } from '@/app/lib/utils'
import { londonHhmmInMinutes, readyAtFromLondonClock } from '@/app/lib/london-time'

const PREP_OPTIONS = [10, 15, 20, 25, 30, 45]

export function AcceptOrderModal({
  orderNumber,
  orderType,
  isPreorder,
  preorderFor,
  defaultPrepMins,
  onCancel,
  onAccept,
}: {
  orderNumber: number
  orderType?: string | null
  isPreorder?: boolean
  preorderFor?: string | null
  defaultPrepMins: number
  onCancel: () => void
  onAccept: (payload: { prep_time_mins: number; ready_at: string }) => Promise<string | void>
}) {
  const defaultMins = Math.min(120, Math.max(5, defaultPrepMins || 30))
  const [prepMins, setPrepMins] = useState(defaultMins)
  const [custom, setCustom] = useState('')
  const [clock, setClock] = useState(() => londonHhmmInMinutes(new Date(), defaultMins))
  const [mode, setMode] = useState<'mins' | 'clock'>('mins')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const readyAt = useMemo(() => {
    if (mode === 'clock') {
      return readyAtFromLondonClock(clock, {
        day: preorderFor ? new Date(preorderFor) : undefined,
      })
    }
    const mins = custom ? parseInt(custom, 10) || defaultMins : prepMins
    const from = isPreorder && preorderFor ? new Date(preorderFor) : new Date()
    const start = from.getTime() > Date.now() ? from : new Date()
    return new Date(start.getTime() + mins * 60_000)
  }, [mode, clock, custom, prepMins, defaultMins, isPreorder, preorderFor])

  const activeMins = Math.max(1, Math.round((readyAt.getTime() - Date.now()) / 60_000))
  const readyLabel = readyAtCustomerLabel(orderType)
  const timeNoun = orderType === 'DELIVERY' ? 'delivery' : 'collection'

  async function handleAccept() {
    setSaving(true)
    setError('')
    const message = await onAccept({
      prep_time_mins: activeMins,
      ready_at: readyAt.toISOString(),
    })
    if (message) setError(message)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white">
          Accept Order {formatOrderNumber(orderNumber)}
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Choose how long to prepare, or the {timeNoun} time the customer should see.
        </p>

        <p className="text-xs font-medium text-slate-400 mt-4 uppercase tracking-wide">
          Preparation time
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {PREP_OPTIONS.map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => {
                setPrepMins(mins)
                setCustom('')
                setClock(londonHhmmInMinutes(new Date(), mins))
                setMode('mins')
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                mode === 'mins' && !custom && prepMins === mins
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
            onChange={(e) => {
              setCustom(e.target.value)
              setMode('mins')
              const mins = parseInt(e.target.value, 10)
              if (mins > 0) setClock(londonHhmmInMinutes(new Date(), mins))
            }}
            placeholder={String(defaultMins)}
            className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
          />
        </div>

        <div className="mt-4">
          <label className="text-xs text-slate-400">
            {orderType === 'DELIVERY' ? 'Delivery time' : 'Collection time'}
          </label>
          <input
            type="time"
            value={clock}
            onChange={(e) => {
              setClock(e.target.value)
              setMode('clock')
            }}
            className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
          />
        </div>

        <p className="text-sm text-emerald-400 mt-4">
          Customer told: {readyLabel} {formatReadyAtTime(readyAt)}
        </p>
        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}

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
