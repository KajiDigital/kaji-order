export type CustomerIdentity = {
  customerId?: string | null
  email?: string | null
  phone?: string | null
}

export type AllowedCustomer = {
  email?: string | null
  phone?: string | null
  name?: string | null
}

export function normalizeEmail(email?: string | null): string | null {
  const value = email?.trim().toLowerCase()
  return value ? value : null
}

export function normalizeUkPhone(raw?: string | null): string | null {
  if (!raw) return null
  let digits = raw.replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('0')) digits = `44${digits.slice(1)}`
  else if (digits.length === 10) digits = `44${digits}`
  else if (!digits.startsWith('44') && digits.length >= 10) digits = `44${digits}`
  return digits.length >= 11 ? digits : null
}

export function sameCustomer(a: CustomerIdentity, b: CustomerIdentity): boolean {
  if (a.customerId && b.customerId && a.customerId === b.customerId) return true

  const phoneA = normalizeUkPhone(a.phone)
  const phoneB = normalizeUkPhone(b.phone)
  if (phoneA && phoneB && phoneA === phoneB) return true

  const emailA = normalizeEmail(a.email)
  const emailB = normalizeEmail(b.email)
  if (emailA && emailB && emailA === emailB) return true

  return false
}

export function hasIdentity(identity?: CustomerIdentity | null): boolean {
  if (!identity) return false
  return Boolean(identity.customerId || normalizeUkPhone(identity.phone) || normalizeEmail(identity.email))
}

export function isAllowedCustomer(
  identity: CustomerIdentity,
  allowed: AllowedCustomer[]
): boolean {
  if (allowed.length === 0) return false
  return allowed.some((entry) => sameCustomer(identity, entry))
}

export function identityFromOrder(order: {
  customer_id?: string | null
  customer_email?: string | null
  customer_phone?: string | null
}): CustomerIdentity {
  return {
    customerId: order.customer_id,
    email: order.customer_email,
    phone: order.customer_phone,
  }
}
