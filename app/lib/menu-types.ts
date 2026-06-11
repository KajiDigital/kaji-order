export type OptionGroupType = 'SINGLE' | 'MULTIPLE' | 'OPTIONAL'

export type ComboSourceType = 'ITEMS' | 'CATEGORY' | 'ANY'

export type PricingType = 'FIXED' | 'OPTIONS' | 'BUNDLE'

export type MenuOption = {
  id: string
  name: string
  description?: string | null
  price_delta: number
  is_default?: boolean
  available?: boolean
  image_url?: string | null
  linked_item_id?: string | null
  sort_order?: number
}

export type MenuOptionGroup = {
  id: string
  name: string
  description?: string | null
  group_type: OptionGroupType
  required: boolean
  min_selections: number
  max_selections: number
  sort_order?: number
  options: MenuOption[]
}

export type ComboOptionItem = {
  id: string
  menu_item_id: string
  name: string
  base_price?: number
  price_override?: number | null
  sort_order?: number
}

export type MenuComboGroup = {
  id: string
  name: string
  required: boolean
  min_items: number
  max_items: number
  source_type: ComboSourceType
  source_category_id?: string | null
  sort_order?: number
  combo_options: ComboOptionItem[]
}

export type MenuProduct = {
  id: string
  name: string
  description?: string | null
  base_price: number
  image_url?: string | null
  available: boolean
  is_bundle?: boolean
  featured?: boolean
  calories?: number | null
  allergens?: string[] | null
  spice_level?: number | null
  is_vegan?: boolean
  is_vegetarian?: boolean
  is_gluten_free?: boolean
  pricing_type?: PricingType
  option_groups: MenuOptionGroup[]
  combo_groups: MenuComboGroup[]
}

export type SelectionSnapshot = {
  kind: 'option' | 'combo'
  group: string
  group_id?: string
  option?: string
  option_id?: string
  item_id?: string
  item_name?: string
  price_delta: number
}

export type BasketSelection = SelectionSnapshot

export type BasketItemPayload = {
  id: string
  menuItemId: string
  name: string
  base_price: number
  quantity: number
  selections: BasketSelection[]
  options_price: number
  total_price: number
  notes?: string
  categoryId?: string
}

export const ALLERGENS = [
  'gluten',
  'dairy',
  'nuts',
  'eggs',
  'soy',
  'fish',
  'shellfish',
  'sesame',
  'celery',
  'mustard',
  'lupin',
  'sulphites',
] as const

export type Allergen = (typeof ALLERGENS)[number]
