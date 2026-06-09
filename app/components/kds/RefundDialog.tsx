'use client'

import { useState } from 'react'
import { formatPence } from '@/app/lib/utils'
import { REFUND_REASONS } from '@/app/lib/refunds'

type RefundDialogProps = {
  customerName: string
  amountPence: number
  maxAmountPence?: number
  allowPartial?: boolean
  onConfirm: (reason: string, amountPence?: number) => Promise<void>
  onClose: () => void
}

export function RefundDialog({
  customerName,
  amountPence,
  maxAmountPence,
  allowPartial = false,
  onConfirm,
  onClose,
}: RefundDialogProps) {
  const max = maxAmountPence ?? amountPence
  const [reason, setReason] = useState<string>(REFUND_REASONS[0])
  const [customReason, setCustomReason] = useState('')
  const [partialPounds, setPartialPounds] = useState((max / 100).toFixed(2))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const finalReason = reason === 'Other' ? customReason.trim() || 'Other' : reason
  const refundAmount = allowPartial
    ? Math.round(parseFloat(partialPounds || '0') * 100)
    : amountPence

  async function handleConfirm() {
    if (!finalReason) {
      setError('Please provide a reason')
      return
    }
    if (allowPartial && (refundAmount <= 0 || refundAmount > max)) {
      setError(`Amount must be between £0.01 and ${formatPence(max)}`)
      return
    }

    setLoading(true)
    setError('')
    try {
      await onConfirm(finalReason, allowPartial ? refundAmount : undefined)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refund failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6">
        {success ? (
          <>
            <h3 className="text-lg font-bold text-white">Refund processed successfully</h3>
            <p className="text-sm text-slate-400 mt-2">
              {formatPence(refundAmount)} refunded to {customerName}.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full py-2 bg-violet-600 text-white rounded-lg text-sm"
            >
              Close
            </button>
          </>
        ) : (
          <>
            <h3 className="text-lg font-bold text-white">Confirm refund</h3>
            <p className="text-sm text-slate-300 mt-2">
              Refund {formatPence(allowPartial ? refundAmount : amountPence)} to {customerName}?
            </p>

            <label className="block mt-4 text-xs text-slate-400">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              {REFUND_REASONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            {reason === 'Other' && (
              <input
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter reason"
                className="w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              />
            )}

            {allowPartial && (
              <>
                <label className="block mt-4 text-xs text-slate-400">
                  Amount (max {formatPence(max)})
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-slate-400">£</span>
                  <input
                    type="number"
                    min="0.01"
                    max={(max / 100).toFixed(2)}
                    step="0.01"
                    value={partialPounds}
                    onChange={(e) => setPartialPounds(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </>
            )}

            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Confirm refund'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
