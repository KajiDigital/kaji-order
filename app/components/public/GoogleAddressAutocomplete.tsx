'use client'

import { useEffect, useRef, useState } from 'react'
import {
  attachPlacesAutocomplete,
  getGooglePlacesApiKey,
  loadGooglePlacesScript,
  type GooglePlace,
} from '@/app/lib/google-places'

type Props = {
  placeholder?: string
  className?: string
  defaultValue?: string
  onPlaceSelect: (place: GooglePlace) => void
  onInputChange?: (value: string) => void
  showAttribution?: boolean
}

export function GoogleAddressAutocomplete({
  placeholder = 'Start typing your address…',
  className,
  defaultValue = '',
  onPlaceSelect,
  onInputChange,
  showAttribution = true,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const onPlaceSelectRef = useRef(onPlaceSelect)
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const apiKey = getGooglePlacesApiKey()

  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect
  }, [onPlaceSelect])

  useEffect(() => {
    if (!apiKey || !inputRef.current) return

    let detach: (() => void) | undefined
    let cancelled = false

    void loadGooglePlacesScript(apiKey)
      .then(() => {
        if (cancelled || !inputRef.current) return
        detach = attachPlacesAutocomplete(inputRef.current, (place) => {
          onPlaceSelectRef.current(place)
        })
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })

    return () => {
      cancelled = true
      detach?.()
    }
  }, [apiKey])

  if (!apiKey) {
    return null
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => onInputChange?.(e.target.value)}
        className={className}
      />
      {loadError && (
        <p className="mt-1 text-xs text-red-600">
          Address search could not load. Enter your address manually.
        </p>
      )}
      {showAttribution && ready && (
        <p className="mt-1 text-xs text-stone-400">Powered by Google</p>
      )}
    </div>
  )
}
