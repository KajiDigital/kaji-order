import { DAYS, type OpeningHours } from './utils'

const UK_TZ = 'Europe/London'

const SHORT_DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
const FULL_DAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const

type NormalizedDay = {
  open: boolean
  fromMins: number
  toMins: number
  fromTime: string
}

type UkNow = {
  dayIndex: number
  minutes: number
}

export type OpenStatus = {
  isOpen: boolean
  nextOpenTime: string | null
  nextOpenDay: string | null
  statusMessage: string
  canOrder: boolean
  isPreorderMode: boolean
  nextOpenAt: Date | null
  showMenu: boolean
  closedReason?: 'holiday' | 'closed_today' | 'outside_hours'
  banner?: { title: string; description: string; badge: string }
}

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

function getUkNow(): UkNow {
  const instant = new Date()
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: UK_TZ,
    weekday: 'short',
  })
    .format(instant)
    .toLowerCase()
    .slice(0, 3)

  const dayIndex = SHORT_DAY_KEYS.indexOf(weekday as (typeof SHORT_DAY_KEYS)[number])
  const timeParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: UK_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(instant)

  const hour = Number(timeParts.find((p) => p.type === 'hour')?.value ?? 0)
  const minute = Number(timeParts.find((p) => p.type === 'minute')?.value ?? 0)

  return {
    dayIndex: dayIndex >= 0 ? dayIndex : instant.getDay(),
    minutes: hour * 60 + minute,
  }
}

function readDayEntry(raw: Record<string, unknown>, dayIndex: number): NormalizedDay | null {
  const shortKey = SHORT_DAY_KEYS[dayIndex]
  const fullKey = FULL_DAY_KEYS[dayIndex]
  const entry = (raw[shortKey] ?? raw[fullKey]) as Record<string, unknown> | undefined
  if (!entry || typeof entry !== 'object') return null

  const open = Boolean(entry.open)
  const fromTime = String(entry.from ?? entry.openTime ?? '11:00')
  const toTime = String(entry.to ?? entry.closeTime ?? '22:00')

  return {
    open,
    fromMins: timeToMinutes(fromTime),
    toMins: timeToMinutes(toTime),
    fromTime,
  }
}

function normalizeHours(raw: unknown): NormalizedDay[] | null {
  if (!raw || typeof raw !== 'object' || Object.keys(raw as object).length === 0) {
    return null
  }

  const record = raw as Record<string, unknown>
  return SHORT_DAY_KEYS.map((_, index) => readDayEntry(record, index) ?? {
    open: false,
    fromMins: 660,
    toMins: 1320,
    fromTime: '11:00',
  })
}

function isCurrentlyOpen(uk: UkNow, day: NormalizedDay | null): boolean {
  if (!day?.open) return false
  return uk.minutes >= day.fromMins && uk.minutes < day.toMins
}

function dayLabel(offset: number, dayIndex: number): string {
  if (offset === 0) return 'today'
  if (offset === 1) return 'tomorrow'
  return FULL_DAY_KEYS[dayIndex].charAt(0).toUpperCase() + FULL_DAY_KEYS[dayIndex].slice(1)
}

function findNextOpen(
  uk: UkNow,
  hours: NormalizedDay[] | null,
  maxDaysAhead: number
): {
  offset: number
  dayIndex: number
  day: NormalizedDay
  minutesUntil: number
} | null {
  if (!hours) return null

  let elapsed = 0

  for (let offset = 0; offset <= maxDaysAhead; offset++) {
    const dayIndex = (uk.dayIndex + offset) % 7
    const day = hours[dayIndex]

    if (offset === 0) {
      if (!day?.open) {
        elapsed += 1440 - uk.minutes
        continue
      }
      if (uk.minutes < day.fromMins) {
        return {
          offset,
          dayIndex,
          day,
          minutesUntil: elapsed + (day.fromMins - uk.minutes),
        }
      }
      if (uk.minutes < day.toMins) {
        return { offset, dayIndex, day, minutesUntil: 0 }
      }
      elapsed += 1440 - uk.minutes
      continue
    }

    if (!day?.open) {
      elapsed += 1440
      continue
    }

    return {
      offset,
      dayIndex,
      day,
      minutesUntil: elapsed + day.fromMins,
    }
  }

  return null
}

export function getOpenStatus(
  opening_hours: unknown,
  holiday_mode: boolean,
  accept_preorders: boolean,
  show_menu_when_closed: boolean,
  collection_enabled = true,
  preorder_days_ahead = 1,
  holiday_message?: string | null
): OpenStatus {
  const uk = getUkNow()
  const hours = normalizeHours(opening_hours)
  const today = hours?.[uk.dayIndex] ?? null
  const isOpen = hours === null ? true : isCurrentlyOpen(uk, today)
  const next = findNextOpen(uk, hours, Math.max(preorder_days_ahead, 7))

  const nextOpenTime = next ? formatTime12h(next.day.fromTime) : null
  const nextOpenDay = next ? dayLabel(next.offset, next.dayIndex) : null
  const nextOpenAt =
    next && next.minutesUntil > 0
      ? new Date(Date.now() + next.minutesUntil * 60 * 1000)
      : null

  const opensLabel =
    nextOpenTime && nextOpenDay
      ? nextOpenDay === 'today'
        ? `Opens today at ${nextOpenTime}`
        : nextOpenDay === 'tomorrow'
          ? `Opens tomorrow at ${nextOpenTime}`
          : `Opens ${nextOpenDay} at ${nextOpenTime}`
      : 'Please check back later'

  if (holiday_mode) {
    return {
      isOpen: false,
      nextOpenTime,
      nextOpenDay,
      statusMessage: holiday_message?.trim() || "We're temporarily closed",
      canOrder: false,
      isPreorderMode: false,
      nextOpenAt: null,
      showMenu: show_menu_when_closed,
      closedReason: 'holiday',
      banner: {
        title: "We're temporarily closed",
        description:
          holiday_message?.trim() ||
          "We're taking a short break. Please check back soon.",
        badge: 'Closed',
      },
    }
  }

  if (!collection_enabled) {
    return {
      isOpen: false,
      nextOpenTime,
      nextOpenDay,
      statusMessage: 'Online ordering is currently unavailable',
      canOrder: false,
      isPreorderMode: false,
      nextOpenAt: null,
      showMenu: show_menu_when_closed,
      closedReason: 'outside_hours',
      banner: {
        title: 'Ordering unavailable',
        description: 'This restaurant is not accepting online orders right now.',
        badge: 'Closed',
      },
    }
  }

  if (isOpen) {
    return {
      isOpen: true,
      nextOpenTime,
      nextOpenDay,
      statusMessage: 'Open for orders',
      canOrder: true,
      isPreorderMode: false,
      nextOpenAt: null,
      showMenu: true,
    }
  }

  const closedReason = today && !today.open ? 'closed_today' : 'outside_hours'
  const nextWithinWindow = findNextOpen(uk, hours, preorder_days_ahead)
  const canPreorder =
    accept_preorders && nextWithinWindow !== null && nextWithinWindow.minutesUntil >= 0

  if (!show_menu_when_closed) {
    return {
      isOpen: false,
      nextOpenTime,
      nextOpenDay,
      statusMessage: opensLabel,
      canOrder: false,
      isPreorderMode: false,
      nextOpenAt,
      showMenu: false,
      closedReason,
      banner: {
        title: "We're closed",
        description: opensLabel,
        badge: 'Closed',
      },
    }
  }

  if (canPreorder) {
    return {
      isOpen: false,
      nextOpenTime,
      nextOpenDay,
      statusMessage: `Pre-order — we'll prepare your order when we open at ${nextOpenTime}`,
      canOrder: true,
      isPreorderMode: true,
      nextOpenAt:
        nextWithinWindow && nextWithinWindow.minutesUntil > 0
          ? new Date(Date.now() + nextWithinWindow.minutesUntil * 60 * 1000)
          : nextOpenAt,
      showMenu: true,
      closedReason,
      banner: {
        title: 'Pre-order available',
        description: `Place your order now — we'll start preparing when we open at ${nextOpenTime}.`,
        badge: 'Pre-order',
      },
    }
  }

  return {
    isOpen: false,
    nextOpenTime,
    nextOpenDay,
    statusMessage: opensLabel,
    canOrder: false,
    isPreorderMode: false,
    nextOpenAt,
    showMenu: true,
    closedReason,
    banner: {
      title: "We're closed right now",
      description: `${opensLabel}. You can browse our menu below.`,
      badge: 'Browse only',
    },
  }
}

/** @deprecated Use getOpenStatus instead */
export function isRestaurantOpen(
  openingHours: unknown,
  holidayMode: boolean
): { open: boolean; reason?: string } {
  const status = getOpenStatus(openingHours, holidayMode, false, true, true)
  return {
    open: status.isOpen,
    reason: status.closedReason,
  }
}

/** @deprecated Use getOpenStatus instead */
export function getClosedStatusMessage(
  openingHours: unknown,
  holidayMode: boolean,
  holidayMessage?: string | null,
  closedReason?: string
): { title: string; description: string } {
  const status = getOpenStatus(
    openingHours,
    holidayMode,
    false,
    true,
    true,
    1,
    holidayMessage
  )
  if (status.banner) return { title: status.banner.title, description: status.banner.description }

  const next = findNextOpen(getUkNow(), normalizeHours(openingHours), 7)
  const hint = next
    ? `${dayLabel(next.offset, next.dayIndex)} at ${formatTime12h(next.day.fromTime)}`
    : null

  if (closedReason === 'closed_today') {
    return {
      title: "We're closed today",
      description: hint
        ? `Feel free to browse our menu. We'll be accepting orders again ${hint}.`
        : 'Feel free to browse our menu. Please come back when we reopen to place an order.',
    }
  }

  return {
    title: "We're closed right now",
    description: hint
      ? `You can browse our menu below. Online ordering opens ${hint}.`
      : 'You can browse our menu below. Please come back during our opening hours to place an order.',
  }
}

export function parseOpeningHours(raw: unknown): OpeningHours {
  const normalized = normalizeHours(raw)

  if (!normalized) {
    return DAYS.reduce(
      (acc, day) => ({
        ...acc,
        [day]: { open: true, openTime: '11:00', closeTime: '22:00' },
      }),
      {} as OpeningHours
    )
  }

  return FULL_DAY_KEYS.reduce((acc, fullKey, index) => {
    const day = normalized[index]
    const closeTime = day
      ? `${String(Math.floor(day.toMins / 60)).padStart(2, '0')}:${String(day.toMins % 60).padStart(2, '0')}`
      : '22:00'
    return {
      ...acc,
      [fullKey]: {
        open: day?.open ?? false,
        openTime: day?.fromTime ?? '11:00',
        closeTime,
      },
    }
  }, {} as OpeningHours)
}
