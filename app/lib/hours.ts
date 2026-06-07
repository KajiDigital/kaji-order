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
