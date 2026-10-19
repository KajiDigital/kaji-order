import { normalizeUkPostcode } from '@/app/lib/uk-postcode'

export type GooglePlace = {
  formatted_address?: string
  address_components?: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>
}

type GoogleAutocomplete = {
  addListener: (event: string, cb: () => void) => { remove: () => void }
  getPlace: () => GooglePlace
}

type GoogleMapsPlaces = {
  Autocomplete: new (
    input: HTMLInputElement,
    opts?: {
      componentRestrictions?: { country: string | string[] }
      fields?: string[]
      types?: string[]
    }
  ) => GoogleAutocomplete
}

type GoogleMapsApi = {
  maps: {
    places: GoogleMapsPlaces
    event?: { clearInstanceListeners: (obj: unknown) => void }
  }
}

declare global {
  interface Window {
    google?: GoogleMapsApi
  }
}

let loadPromise: Promise<void> | null = null

export function getGooglePlacesApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY?.trim() || undefined
}

export function loadGooglePlacesScript(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Places is only available in the browser'))
  }

  if (window.google?.maps?.places) {
    return Promise.resolve()
  }

  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-kaji-google-places]'
    )
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`
    script.async = true
    script.defer = true
    script.dataset.kajiGooglePlaces = 'true'
    script.onload = () => resolve()
    script.onerror = () => {
      loadPromise = null
      reject(new Error('Failed to load Google Maps'))
    }
    document.head.appendChild(script)
  })

  return loadPromise
}

export function extractUkPostcodeFromPlace(place: GooglePlace): string | null {
  const component = place.address_components?.find((c) => c.types.includes('postal_code'))
  if (!component?.long_name) return null
  return normalizeUkPostcode(component.long_name)
}

/** Street-level line without trailing postcode (for display/storage). */
export function formatPlaceAddress(place: GooglePlace): string {
  const formatted = place.formatted_address?.trim()
  if (!formatted) return ''

  const postcode = extractUkPostcodeFromPlace(place)
  if (!postcode) return formatted

  const withoutPostcode = formatted
    .replace(new RegExp(`\\s*${postcode.replace(/\s/g, '\\s*')}\\s*$`, 'i'), '')
    .replace(/,\s*$/, '')
    .trim()

  return withoutPostcode || formatted
}

export function attachPlacesAutocomplete(
  input: HTMLInputElement,
  onPlaceSelect: (place: GooglePlace) => void
): () => void {
  const google = window.google
  if (!google?.maps?.places) {
    throw new Error('Google Places is not loaded')
  }

  const autocomplete = new google.maps.places.Autocomplete(input, {
    componentRestrictions: { country: 'gb' },
    fields: ['formatted_address', 'address_components'],
    types: ['address'],
  })

  const listener = autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace()
    if (!place.formatted_address) return
    onPlaceSelect(place)
  })

  return () => {
    listener.remove()
    google.maps.event?.clearInstanceListeners(autocomplete)
  }
}
