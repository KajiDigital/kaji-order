export type Modifier = {
  id: string
  name: string
  price_delta_pence: number
  is_default?: boolean
}

export type ModifierGroup = {
  id: string
  name: string
  required: boolean
  min_select: number
  max_select: number
  modifiers: Modifier[]
}

export type Product = {
  id: string
  name: string
  description?: string | null
  price_pence: number
  image_url?: string | null
  is_available: boolean
  modifier_groups: ModifierGroup[]
}

export type Category = {
  id: string
  name: string
  color: string
  items: Product[]
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
