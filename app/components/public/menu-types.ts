export type {
  MenuOption,
  MenuOptionGroup,
  MenuComboGroup,
  MenuProduct as Product,
  BasketSelection,
  PricingType,
} from '@/app/lib/menu-types'

export type Category = {
  id: string
  name: string
  color: string
  items: import('@/app/lib/menu-types').MenuProduct[]
}

export type MenuPromotion = {
  id: string
  name: string
  applies_to: string
  applicable_ids: string[] | null
  badge_text: string | null
  badge_color: string | null
  promo_type: string
  description?: string | null
  time_from?: string | null
  time_until?: string | null
}

export type Restaurant = {
  slug: string
  name: string
  description?: string | null
  logo_url?: string | null
  banner_url?: string | null
  primary_color: string
  secondary_color: string
  font_choice: string
  show_powered_by: boolean
  phone?: string | null
  email?: string | null
  isLiveOpen: boolean
  canOrder: boolean
  isPreorderMode: boolean
  closedReason?: string
  closedNotice?: { title: string; description: string; badge?: string }
  nextOpenTime?: string | null
  holiday_mode: boolean
  holiday_message?: string | null
  min_order_pence: number
  avg_prep_minutes: number
  service_fee_pence?: number
}
