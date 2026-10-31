import { formatPence } from '@/app/lib/utils'

export const ADMIN_FIELD_CLASS =
  'rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white'
export const ADMIN_FIELD_PLACEHOLDER_CLASS = `${ADMIN_FIELD_CLASS} placeholder:text-slate-500`

export const LOGIN_FILTER_OPTIONS = [
  { value: 'all', label: 'Any last login' },
  { value: '24h', label: 'Logged in last 24 hours' },
  { value: '7d', label: 'Logged in last 7 days' },
  { value: '30d', label: 'Logged in last 30 days' },
  { value: 'older', label: 'Logged in over 30 days ago' },
  { value: 'never', label: 'Never logged in' },
] as const

const DAY_MS = 86_400_000

export function formatAdminDate(value: string | Date | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/London',
  })
}

export function formatLondonWhen(value: string | Date) {
  return new Date(value).toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatLastLogin(value: string | Date | null | undefined) {
  if (!value) return { when: 'Never', ago: 'No login recorded' }
  const date = new Date(value)
  const when = date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/London',
  })
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000))
  const ago =
    minutes < 1
      ? 'Just now'
      : minutes < 60
        ? `${minutes} min ago`
        : minutes < 60 * 24
          ? `${Math.round(minutes / 60)} hr ago`
          : minutes < 60 * 48
            ? 'Yesterday'
            : `${Math.round(minutes / (60 * 24))} days ago`
  return { when, ago }
}

export function matchesLoginFilter(value: string | Date | null | undefined, login: string) {
  if (login === 'all') return true
  if (login === 'never') return !value
  if (!value) return false
  const age = Date.now() - new Date(value).getTime()
  if (login === '24h') return age <= DAY_MS
  if (login === '7d') return age <= 7 * DAY_MS
  if (login === '30d') return age <= 30 * DAY_MS
  if (login === 'older') return age > 30 * DAY_MS
  return true
}

export function lastLoginPrismaWhere(login: string) {
  if (login === 'never') return { last_login_at: null }
  if (login === 'older') return { last_login_at: { lt: new Date(Date.now() - 30 * DAY_MS) } }
  if (login === '24h') return { last_login_at: { gte: new Date(Date.now() - DAY_MS) } }
  if (login === '7d') return { last_login_at: { gte: new Date(Date.now() - 7 * DAY_MS) } }
  if (login === '30d') return { last_login_at: { gte: new Date(Date.now() - 30 * DAY_MS) } }
  return {}
}

export function latestIsoTimestamp(values: (Date | null | undefined)[]) {
  const latest = values
    .filter((value): value is Date => value != null)
    .sort((a, b) => b.getTime() - a.getTime())[0]
  return latest?.toISOString() ?? null
}

export function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

export function vsYesterday(today: number, yesterday: number, money = false) {
  const diff = today - yesterday
  if (diff === 0) return 'Same as yesterday'
  const sign = diff > 0 ? '+' : '-'
  const amount = money ? formatPence(Math.abs(diff)) : String(Math.abs(diff))
  return `${sign}${amount} vs yesterday`
}
