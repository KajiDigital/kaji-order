export function normalizeUkPostcode(postcode: string): string {
  const compact = postcode.replace(/\s+/g, '').toUpperCase()
  if (compact.length <= 3) return compact
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`
}

export function isValidUkPostcode(postcode: string): boolean {
  const compact = postcode.replace(/\s+/g, '').toUpperCase()
  return /^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(compact)
}
