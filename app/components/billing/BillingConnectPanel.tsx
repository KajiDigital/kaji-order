'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { StripeConnectStatus } from '@/app/lib/stripe-connect'

export function BillingConnectPanel({
  initial,
  stripeConfigured,
  returnedFromStripe,
  resumeOnboarding,
}: {
  initial: StripeConnectStatus
  stripeConfigured: boolean
  returnedFromStripe: boolean
  resumeOnboarding: boolean
}) {
  const router = useRouter()
  const [status, setStatus] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const autoStarted = useRef(false)

  useEffect(() => {
    setStatus(initial)
  }, [initial])

  async function startOnboarding() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
        return
      }
      if (data.ready) {
        setStatus((prev) => ({
          ...prev,
          ready: true,
          chargesEnabled: true,
          detailsSubmitted: true,
          payoutsEnabled: Boolean(data.payoutsEnabled),
          accountId: data.accountId ?? prev.accountId,
        }))
        router.refresh()
        return
      }
      setError(data.error ?? 'Could not start Stripe onboarding.')
    } catch {
      setError('Could not start Stripe onboarding.')
    } finally {
      setBusy(false)
    }
  }

  async function openDashboard() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/connect/login', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
        return
      }
      setError(data.error ?? 'Could not open Stripe.')
    } catch {
      setError('Could not open Stripe.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!stripeConfigured || !resumeOnboarding || status.ready || autoStarted.current) return
    autoStarted.current = true
    setBusy(true)
    fetch('/api/stripe/connect', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (data.url) {
          window.location.href = data.url
          return
        }
        if (!data.ready) {
          setError(data.error ?? 'Could not resume Stripe onboarding.')
        }
        router.refresh()
      })
      .catch(() => setError('Could not resume Stripe onboarding.'))
      .finally(() => setBusy(false))
  }, [resumeOnboarding, stripeConfigured, status.ready, router])

  if (!stripeConfigured) {
    return (
      <p className="text-slate-400 text-sm">
        Stripe is not configured on this server yet. Card payments cannot be connected.
      </p>
    )
  }

  const banner = returnedFromStripe
    ? status.ready
      ? 'Stripe is connected. Customer payments will go to your account.'
      : 'Stripe still needs a bit more information. Click Finish setup to continue.'
    : null

  return (
    <div className="space-y-4">
      {banner && (
        <p className={`text-sm ${status.ready ? 'text-emerald-400' : 'text-amber-400'}`}>
          {banner}
        </p>
      )}

      {status.ready ? (
        <div className="space-y-3">
          <p className="text-emerald-400 text-sm font-medium">Connected</p>
          <p className="text-slate-400 text-sm">
            Customer card payments go to your Stripe account. Kaji keeps the platform fee
            (commission + service fee) automatically.
          </p>
          {!status.payoutsEnabled && (
            <p className="text-amber-400 text-sm">
              Stripe is still verifying payouts. You can take payments, but bank transfers
              may take a little longer to start.
            </p>
          )}
          {status.accountId && (
            <p className="text-xs text-slate-500 font-mono break-all">{status.accountId}</p>
          )}
          <button
            type="button"
            onClick={() => void openDashboard()}
            disabled={busy}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm cursor-pointer hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? 'Opening…' : 'Open Stripe dashboard'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-slate-400 text-sm">
            {status.accountId
              ? 'Your Stripe account is created, but onboarding is not finished. Until you finish, card payments stay with Kaji and are not paid out to you.'
              : 'Connect Stripe to receive customer payments. Until you connect, card payments stay with Kaji.'}
          </p>
          <button
            type="button"
            onClick={() => void startOnboarding()}
            disabled={busy}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm cursor-pointer hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy
              ? 'Redirecting to Stripe…'
              : status.accountId
                ? 'Finish Stripe setup'
                : 'Connect Stripe'}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
