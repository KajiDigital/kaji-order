import prisma from '@/app/lib/prisma'
import { isValidUkPostcode, normalizeUkPostcode } from '@/app/lib/uk-postcode'

export { isValidUkPostcode, normalizeUkPostcode } from '@/app/lib/uk-postcode'

export type DeliveryValidation = {
  valid: boolean
  error?: string
  fee_pence: number
  minimum_order_pence: number
  zone_name?: string
  distance_km?: number
  postcode?: string
}

function postcodePrefix(postcode: string): string {
  return postcode.replace(/\s+/g, '').toUpperCase()
}

function matchesPrefix(postcode: string, prefix: string): boolean {
  return postcodePrefix(postcode).startsWith(postcodePrefix(prefix))
}

function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

type PostcodeCoords = { lat: number; lng: number }

async function lookupPostcodeCoords(postcode: string): Promise<PostcodeCoords | null> {
  const normalized = normalizeUkPostcode(postcode)
  try {
    const res = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(normalized)}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    const data = (await res.json()) as {
      status: number
      result?: { latitude: number; longitude: number }
    }
    if (data.status !== 200 || !data.result) return null
    return { lat: data.result.latitude, lng: data.result.longitude }
  } catch {
    return null
  }
}

export async function getDeliveryFeePence(
  restaurantId: string,
  deliveryPostcode?: string
): Promise<number> {
  if (deliveryPostcode?.trim()) {
    const result = await validateDeliveryForRestaurant(restaurantId, deliveryPostcode)
    if (result.valid) return result.fee_pence
  }

  const zone = await prisma.deliveryZone.findFirst({
    where: { restaurant_id: restaurantId, is_active: true },
    orderBy: { sort_order: 'asc' },
  })
  return zone?.delivery_fee_pence ?? 0
}

export async function getDeliveryMinimumPence(
  restaurantId: string,
  deliveryPostcode?: string
): Promise<number> {
  if (deliveryPostcode?.trim()) {
    const result = await validateDeliveryForRestaurant(restaurantId, deliveryPostcode)
    if (result.valid) return result.minimum_order_pence
  }

  const zone = await prisma.deliveryZone.findFirst({
    where: { restaurant_id: restaurantId, is_active: true },
    orderBy: { sort_order: 'asc' },
  })
  return zone?.minimum_order_pence ?? 0
}

export async function validateDeliveryForRestaurant(
  restaurantId: string,
  deliveryPostcode: string
): Promise<DeliveryValidation> {
  const normalized = normalizeUkPostcode(deliveryPostcode)

  if (!isValidUkPostcode(normalized)) {
    return {
      valid: false,
      error: 'Please enter a valid UK postcode',
      fee_pence: 0,
      minimum_order_pence: 0,
    }
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      delivery_zones: {
        where: { is_active: true },
        orderBy: { sort_order: 'asc' },
        include: { postcode_rules: true },
      },
      postcode_rules: true,
    },
  })

  if (!restaurant) {
    return {
      valid: false,
      error: 'Restaurant not found',
      fee_pence: 0,
      minimum_order_pence: 0,
    }
  }

  if (!restaurant.delivery_enabled) {
    return {
      valid: false,
      error: 'Delivery is not available from this restaurant',
      fee_pence: 0,
      minimum_order_pence: 0,
    }
  }

  const activeZones = restaurant.delivery_zones
  const primaryZone = activeZones[0]
  const windowStatus = getDeliveryWindowStatus(
    primaryZone?.delivery_from,
    primaryZone?.delivery_until
  )
  if (!windowStatus.availableNow) {
    return {
      valid: false,
      error: windowStatus.message || 'Delivery is not available right now',
      fee_pence: 0,
      minimum_order_pence: 0,
    }
  }
  const deliveryCoords = await lookupPostcodeCoords(normalized)
  if (!deliveryCoords) {
    return {
      valid: false,
      error: 'We could not find that postcode. Check it and try again.',
      fee_pence: 0,
      minimum_order_pence: 0,
    }
  }

  const restaurantRules = restaurant.postcode_rules.filter((r) => !r.delivery_zone_id)
  const excludeRules = restaurantRules.filter((r) => r.rule_type === 'EXCLUDE')
  for (const rule of excludeRules) {
    if (matchesPrefix(normalized, rule.postcode_prefix)) {
      return {
        valid: false,
        error: 'Sorry, we do not deliver to this postcode',
        fee_pence: 0,
        minimum_order_pence: 0,
        postcode: normalized,
      }
    }
  }

  const includeRules = restaurantRules.filter((r) => r.rule_type === 'INCLUDE')
  if (includeRules.length > 0) {
    const allowed = includeRules.some((r) => matchesPrefix(normalized, r.postcode_prefix))
    if (!allowed) {
      return {
        valid: false,
        error: 'Sorry, we do not deliver to this postcode',
        fee_pence: 0,
        minimum_order_pence: 0,
        postcode: normalized,
      }
    }
  }

  let originCoords: PostcodeCoords | null = null
  if (restaurant.postcode?.trim()) {
    originCoords = await lookupPostcodeCoords(restaurant.postcode)
  }

  let matchedZone: (typeof activeZones)[number] | null = null
  let matchedDistance: number | undefined

  if (activeZones.length > 0 && originCoords) {
    for (const zone of activeZones) {
      const zoneExcludes = zone.postcode_rules.filter((r) => r.rule_type === 'EXCLUDE')
      if (zoneExcludes.some((r) => matchesPrefix(normalized, r.postcode_prefix))) {
        continue
      }

      const zoneIncludes = zone.postcode_rules.filter((r) => r.rule_type === 'INCLUDE')
      if (zoneIncludes.length > 0) {
        if (!zoneIncludes.some((r) => matchesPrefix(normalized, r.postcode_prefix))) {
          continue
        }
      }

      const km = distanceKm(originCoords, deliveryCoords)
      if (km <= zone.radius_km) {
        matchedZone = zone
        matchedDistance = Math.round(km * 10) / 10
        break
      }
    }

    if (!matchedZone) {
      return {
        valid: false,
        error: 'Sorry, your address is outside our delivery area',
        fee_pence: 0,
        minimum_order_pence: 0,
        postcode: normalized,
      }
    }
  } else if (activeZones.length > 0) {
    matchedZone = activeZones[0]
  }

  const fee = matchedZone?.delivery_fee_pence ?? 0
  const minimum = Math.max(
    restaurant.min_order_pence,
    matchedZone?.minimum_order_pence ?? 0
  )

  return {
    valid: true,
    fee_pence: fee,
    minimum_order_pence: minimum,
    zone_name: matchedZone?.name,
    distance_km: matchedDistance,
    postcode: normalized,
  }
}

export type DeliveryWindowStatus = {
  availableNow: boolean
  message: string
  fromLabel: string | null
}

export type DeliveryZoneSummary = {
  fee_pence: number
  minimum_order_pence: number
  delivery_from: string | null
  delivery_until: string | null
  window: DeliveryWindowStatus
}

const UK_TZ = 'Europe/London'

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m || 0)
}

function formatTime12h(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'pm' : 'am'
  const hour = h % 12 || 12
  return m === 0 ? `${hour}${period}` : `${hour}:${String(m).padStart(2, '0')}${period}`
}

function getUkMinutesNow(): number {
  const instant = new Date()
  const timeParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: UK_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(instant)
  const hour = Number(timeParts.find((p) => p.type === 'hour')?.value ?? 0)
  const minute = Number(timeParts.find((p) => p.type === 'minute')?.value ?? 0)
  return hour * 60 + minute
}

export function getDeliveryWindowStatus(
  deliveryFrom?: string | null,
  deliveryUntil?: string | null
): DeliveryWindowStatus {
  if (!deliveryFrom?.trim()) {
    return { availableNow: true, message: '', fromLabel: null }
  }

  const fromMins = timeToMinutes(deliveryFrom)
  const untilMins = deliveryUntil?.trim() ? timeToMinutes(deliveryUntil) : 24 * 60
  const now = getUkMinutesNow()
  const fromLabel = formatTime12h(deliveryFrom)

  if (now >= fromMins && now < untilMins) {
    return { availableNow: true, message: '', fromLabel }
  }

  if (now < fromMins) {
    return {
      availableNow: false,
      message: `Delivery from ${fromLabel}`,
      fromLabel,
    }
  }

  return {
    availableNow: false,
    message: 'Delivery not available right now',
    fromLabel,
  }
}

export async function getDeliveryZoneSummary(
  restaurantId: string
): Promise<DeliveryZoneSummary> {
  const zone = await prisma.deliveryZone.findFirst({
    where: { restaurant_id: restaurantId, is_active: true },
    orderBy: { sort_order: 'asc' },
  })

  const deliveryFrom = zone?.delivery_from ?? null
  const deliveryUntil = zone?.delivery_until ?? null

  return {
    fee_pence: zone?.delivery_fee_pence ?? 0,
    minimum_order_pence: zone?.minimum_order_pence ?? 0,
    delivery_from: deliveryFrom,
    delivery_until: deliveryUntil,
    window: getDeliveryWindowStatus(deliveryFrom, deliveryUntil),
  }
}

export async function getOrCreateDefaultDeliveryZone(restaurantId: string) {
  const existing = await prisma.deliveryZone.findFirst({
    where: { restaurant_id: restaurantId },
    orderBy: { sort_order: 'asc' },
  })
  if (existing) return existing

  return prisma.deliveryZone.create({
    data: {
      restaurant_id: restaurantId,
      name: 'Local delivery',
      radius_km: 5,
      delivery_fee_pence: 299,
      minimum_order_pence: 0,
      delivery_from: '17:00',
      sort_order: 0,
    },
  })
}
