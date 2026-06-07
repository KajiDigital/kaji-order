import { DAYS, type DayKey, type OpeningHours } from './utils'

function getDayKey(date: Date): DayKey {
  const keys: DayKey[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ]
  return keys[date.getDay()]
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function isRestaurantOpen(
  openingHours: unknown,
  holidayMode: boolean
): { open: boolean; reason?: string } {
  if (holidayMode) {
    return { open: false, reason: 'holiday' }
  }

  if (!openingHours || typeof openingHours !== 'object') {
    return { open: true }
  }

  const hours = openingHours as OpeningHours
  const now = new Date()
  const dayKey = getDayKey(now)
  const day = hours[dayKey]

  if (!day || !day.open) {
    return { open: false, reason: 'closed_today' }
  }

  const nowMins = now.getHours() * 60 + now.getMinutes()
  const openMins = timeToMinutes(day.openTime)
  const closeMins = timeToMinutes(day.closeTime)

  if (nowMins < openMins || nowMins >= closeMins) {
    return { open: false, reason: 'outside_hours' }
  }

  return { open: true }
}

function formatTime12h(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'pm' : 'am'
  const hour = h % 12 || 12
  return m === 0 ? `${hour}${period}` : `${hour}:${String(m).padStart(2, '0')}${period}`
}

export function getNextOpeningHint(openingHours: unknown, now = new Date()): string | null {
  const hours = parseOpeningHours(openingHours)

  for (let offset = 0; offset <= 7; offset++) {
    const date = new Date(now)
    date.setDate(date.getDate() + offset)
    const dayKey = getDayKey(date)
    const day = hours[dayKey]
    if (!day?.open) continue

    const openMins = timeToMinutes(day.openTime)
    const nowMins = date.getHours() * 60 + date.getMinutes()

    if (offset === 0) {
      if (nowMins < openMins) {
        return `today at ${formatTime12h(day.openTime)}`
      }
      continue
    }

    const dayLabel =
      offset === 1 ? 'tomorrow' : date.toLocaleDateString('en-GB', { weekday: 'long' })
    return `${dayLabel} at ${formatTime12h(day.openTime)}`
  }

  return null
}

export function getClosedStatusMessage(
  openingHours: unknown,
  holidayMode: boolean,
  holidayMessage?: string | null,
  closedReason?: string
): { title: string; description: string } {
  if (holidayMode) {
    return {
      title: "We're temporarily closed",
      description:
        holidayMessage?.trim() ||
        "We're taking a short break. Please check back soon — you can still browse our menu below.",
    }
  }

  const nextOpen = getNextOpeningHint(openingHours)

  if (closedReason === 'closed_today') {
    return {
      title: "We're closed today",
      description: nextOpen
        ? `Feel free to browse our menu. We'll be accepting orders again ${nextOpen}.`
        : 'Feel free to browse our menu. Please come back when we reopen to place an order.',
    }
  }

  if (closedReason === 'outside_hours') {
    return {
      title: "We're closed right now",
      description: nextOpen
        ? `You can browse our menu below. Online ordering opens ${nextOpen} — we'd love to see you then!`
        : 'You can browse our menu below. Please come back during our opening hours to place an order.',
    }
  }

  return {
    title: "We're currently closed",
    description: nextOpen
      ? `Browse our menu now and order ${nextOpen}.`
      : 'You can browse our menu below. Ordering will be available when we reopen.',
  }
}

export function parseOpeningHours(raw: unknown): OpeningHours {
  if (raw && typeof raw === 'object') {
    return raw as OpeningHours
  }
  return DAYS.reduce(
    (acc, day) => ({
      ...acc,
      [day]: { open: true, openTime: '11:00', closeTime: '22:00' },
    }),
    {} as OpeningHours
  )
}
