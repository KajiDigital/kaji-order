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
