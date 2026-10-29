const LONDON = 'Europe/London'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function partMap(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: LONDON,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '0'
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')) % 24,
    minute: Number(get('minute')),
  }
}

function londonOffsetMs(utcDate: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: LONDON,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(utcDate)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value)
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour') % 24,
    get('minute'),
    get('second')
  )
  return asUtc - utcDate.getTime()
}

export function londonDateParts(date = new Date()) {
  const p = partMap(date)
  return {
    ...p,
    ymd: `${p.year}-${pad(p.month)}-${pad(p.day)}`,
    hhmm: `${pad(p.hour)}:${pad(p.minute)}`,
  }
}

export function londonWallTimeToDate(ymd: string, hhmm: string): Date {
  const [year, month, day] = ymd.split('-').map(Number)
  const [hour, minute] = hhmm.split(':').map(Number)
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0))
  const first = new Date(utcGuess.getTime() - londonOffsetMs(utcGuess))
  return new Date(utcGuess.getTime() - londonOffsetMs(first))
}

export function readyAtFromLondonClock(
  hhmm: string,
  options?: { base?: Date; day?: Date }
): Date {
  const base = options?.base ?? new Date()
  const day = options?.day ?? base
  const ymd = londonDateParts(day).ymd
  let readyAt = londonWallTimeToDate(ymd, hhmm)
  if (readyAt.getTime() < base.getTime() - 30_000) {
    const next = new Date(day.getTime() + 24 * 60 * 60 * 1000)
    readyAt = londonWallTimeToDate(londonDateParts(next).ymd, hhmm)
  }
  return readyAt
}

export function londonHhmmInMinutes(from = new Date(), mins: number) {
  return londonDateParts(new Date(from.getTime() + mins * 60_000)).hhmm
}
