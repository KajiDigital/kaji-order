export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`
}

export function formatOrderNumber(num: number): string {
  return `#OL-${String(num).padStart(4, '0')}`
}

export function parsePoundsToPence(pounds: string | number): number {
  const value = typeof pounds === 'string' ? parseFloat(pounds) : pounds
  if (Number.isNaN(value)) return 0
  return Math.round(value * 100)
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002'
}

export function getOrderUrl(slug: string): string {
  return `${getAppUrl()}/${slug}`
}

export function getCommissionPct(plan: string, override?: number): number {
  if (override !== undefined) return override
  return plan === 'COMMISSION' ? 5 : 0
}

/** ISO week number (1–53), Monday-based. */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
}

export function formatReadyAtTime(date: Date | string | null | undefined): string {
  if (!date) return ''
  const value = typeof date === 'string' ? new Date(date) : date
  return value.toLocaleTimeString('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Europe/London',
  })
}

export function formatModifiersText(
  modifiers?: { name: string; priceDeltaPence?: number }[]
): string | null {
  if (!modifiers?.length) return null
  return modifiers.map((m) => m.name).join(', ')
}

/** @deprecated use formatSelectionsText from menu-selections */
export { formatSelectionsText } from './menu-selections'

export function getReportingFields(date = new Date()) {
  return {
    day_of_week: date.getDay(),
    hour_of_day: date.getHours(),
    week_number: getWeekNumber(date),
    month_number: date.getMonth() + 1,
  }
}

export const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

export type DayKey = (typeof DAYS)[number]

export type DayHours = {
  open: boolean
  openTime: string
  closeTime: string
}

export type OpeningHours = Record<DayKey, DayHours>

export function defaultOpeningHours(): OpeningHours {
  const day: DayHours = { open: true, openTime: '11:00', closeTime: '22:00' }
  return {
    monday: { ...day },
    tuesday: { ...day },
    wednesday: { ...day },
    thursday: { ...day },
    friday: { ...day },
    saturday: { ...day },
    sunday: { open: false, openTime: '11:00', closeTime: '22:00' },
  }
}
