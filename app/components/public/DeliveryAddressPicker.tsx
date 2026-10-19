'use client'

import { useCallback, useState } from 'react'
import { formatPence } from '@/app/lib/utils'
import { normalizeUkPostcode } from '@/app/lib/uk-postcode'
import {
  extractUkPostcodeFromPlace,
  formatPlaceAddress,
  getGooglePlacesApiKey,
  type GooglePlace,
} from '@/app/lib/google-places'
import { GoogleAddressAutocomplete } from './GoogleAddressAutocomplete'

type Props = {
  slug: string
  primary: string
  postcode: string
  selectedAddress: string
  feePence: number
  onPostcodeChange: (postcode: string) => void
  onAddressSelect: (address: string, postcode: string) => void
  onValidationChange?: (valid: boolean, feePence: number, minOrderPence: number) => void
}

export function DeliveryAddressPicker({
  slug,
  primary,
  postcode,
  selectedAddress,
  feePence,
  onPostcodeChange,
  onAddressSelect,
  onValidationChange,
}: Props) {
  const [editing, setEditing] = useState(!selectedAddress)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showManual, setShowManual] = useState(!getGooglePlacesApiKey())
  const [manualAddress, setManualAddress] = useState(selectedAddress)
  const [manualPostcode, setManualPostcode] = useState(postcode)
  const googleConfigured = Boolean(getGooglePlacesApiKey())

  const validateAndConfirm = useCallback(
    async (address: string, deliveryPostcode: string) => {
      const normalizedPostcode = normalizeUkPostcode(deliveryPostcode)
      if (!address.trim() || !normalizedPostcode) {
        setError('Please enter a complete address with postcode')
        onValidationChange?.(false, 0, 0)
        return
      }

      setLoading(true)
      setError('')

      try {
        const res = await fetch('/api/delivery/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, postcode: normalizedPostcode }),
        })
        const data = await res.json()

        if (!data.valid) {
          setError(data.error ?? 'Delivery not available to this address')
          onValidationChange?.(false, 0, 0)
          return
        }

        onPostcodeChange(normalizedPostcode)
        onAddressSelect(address.trim(), normalizedPostcode)
        onValidationChange?.(true, data.fee_pence ?? 0, data.minimum_order_pence ?? 0)
        setEditing(false)
      } catch {
        setError('Could not verify delivery area. Try again.')
        onValidationChange?.(false, 0, 0)
      } finally {
        setLoading(false)
      }
    },
    [slug, onPostcodeChange, onAddressSelect, onValidationChange]
  )

  const handleGooglePlace = useCallback(
    (place: GooglePlace) => {
      const address = formatPlaceAddress(place)
      const deliveryPostcode = extractUkPostcodeFromPlace(place)
      if (!address || !deliveryPostcode) {
        setError('Could not read that address. Try again or enter manually.')
        return
      }
      void validateAndConfirm(address, deliveryPostcode)
    },
    [validateAndConfirm]
  )

  function startEditing() {
    setEditing(true)
    setError('')
    setShowManual(!googleConfigured)
  }

  function confirmManual() {
    void validateAndConfirm(manualAddress, manualPostcode)
  }

  if (!editing && selectedAddress) {
    return (
      <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Delivering to
            </p>
            <p className="mt-0.5 text-sm font-medium text-stone-900">{selectedAddress}</p>
            <p className="mt-0.5 text-xs text-stone-500">
              {postcode}
              {feePence > 0 ? ` · ${formatPence(feePence)} delivery` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={startEditing}
            className="shrink-0 text-sm font-semibold underline"
            style={{ color: primary }}
          >
            Change
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
      <p className="text-base font-bold text-stone-900">Where should we deliver?</p>
      <p className="mt-0.5 text-xs text-stone-500">
        {googleConfigured && !showManual
          ? 'Start typing your address and pick a suggestion.'
          : 'Enter your full address and postcode.'}
      </p>

      {googleConfigured && !showManual ? (
        <div className="mt-3">
          <GoogleAddressAutocomplete
            placeholder="e.g. 10 High Street, Harrow"
            className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-stone-400"
            onPlaceSelect={handleGooglePlace}
            onInputChange={() => setError('')}
          />
          <button
            type="button"
            onClick={() => setShowManual(true)}
            className="mt-3 text-sm font-medium text-stone-600 underline hover:text-stone-900"
          >
            Enter address manually
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {!googleConfigured && (
            <p className="text-xs text-stone-500">
              Enter your full street address and UK postcode below.
            </p>
          )}
          <textarea
            value={manualAddress}
            onChange={(e) => {
              setManualAddress(e.target.value)
              setError('')
            }}
            placeholder="Flat 1, 110 Hindes Road"
            rows={2}
            className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400"
          />
          <input
            type="text"
            value={manualPostcode}
            onChange={(e) => {
              setManualPostcode(e.target.value.toUpperCase())
              setError('')
            }}
            placeholder="Postcode e.g. HA1 1RD"
            className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm uppercase outline-none focus:border-stone-400"
          />
          {googleConfigured && (
            <button
              type="button"
              onClick={() => setShowManual(false)}
              className="text-xs text-stone-500 underline"
            >
              Back to address search
            </button>
          )}
          <button
            type="button"
            onClick={confirmManual}
            disabled={loading || !manualAddress.trim() || !manualPostcode.trim()}
            className="w-full rounded-full py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-300"
            style={
              !loading && manualAddress.trim() && manualPostcode.trim()
                ? { backgroundColor: primary }
                : undefined
            }
          >
            {loading ? 'Checking…' : 'Use this address'}
          </button>
        </div>
      )}

      {loading && googleConfigured && !showManual && (
        <p className="mt-2 text-sm text-stone-500">Checking delivery area…</p>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
