export const DEFAULT_PRIMARY = '#c2410c'
export const DEFAULT_SECONDARY = '#ffffff'

export const FONT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'modern', label: 'Modern' },
  { value: 'classic', label: 'Classic' },
  { value: 'bold', label: 'Bold' },
] as const

export type FontChoice = (typeof FONT_OPTIONS)[number]['value']

export function getPrimaryColor(restaurant: {
  primary_color?: string | null
  brand_color?: string | null
}): string {
  return restaurant.primary_color ?? restaurant.brand_color ?? DEFAULT_PRIMARY
}

export function getSecondaryColor(restaurant: {
  secondary_color?: string | null
}): string {
  return restaurant.secondary_color ?? DEFAULT_SECONDARY
}

export function getFontClass(font?: string | null): string {
  switch (font) {
    case 'modern':
      return 'font-sans tracking-tight'
    case 'classic':
      return 'font-serif'
    case 'bold':
      return 'font-sans font-medium tracking-wide'
    default:
      return 'font-sans'
  }
}

export function getFontPreviewClass(font?: string | null): string {
  switch (font) {
    case 'modern':
      return 'font-sans text-xl tracking-tight'
    case 'classic':
      return 'font-serif text-xl'
    case 'bold':
      return 'font-sans text-xl font-bold tracking-wide'
    default:
      return 'font-sans text-xl'
  }
}

export function isPaidPlan(plan: string): boolean {
  return plan !== 'COMMISSION'
}

export function shouldShowPoweredBy(restaurant: {
  show_powered_by?: boolean
  pricing_plan?: string
}): boolean {
  if (restaurant.pricing_plan && isPaidPlan(restaurant.pricing_plan)) return false
  return restaurant.show_powered_by !== false
}
