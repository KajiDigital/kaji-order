'use client'

import { useState } from 'react'
import { ItemFormBasicTab, type BasicFormState } from './ItemFormBasicTab'
import { ItemFormOptionsTab, type OptionGroupForm } from './ItemFormOptionsTab'
import { ItemFormComboTab, type ComboGroupForm } from './ItemFormComboTab'
import { ItemFormPricingTab } from './ItemFormPricingTab'
import type { PricingType } from '@/app/lib/menu-types'

export type DbProduct = {
  id: string
  name: string
  description?: string | null
  base_price: number
  image_url?: string | null
  available: boolean
  is_bundle?: boolean
  featured?: boolean
  calories?: number | null
  allergens?: unknown
  spice_level?: number | null
  is_vegan?: boolean
  is_vegetarian?: boolean
  is_gluten_free?: boolean
  pricing_type?: string
  category_id?: string
  option_groups?: {
    name: string
    group_type: string
    required: boolean
    min_selections: number
    max_selections: number
    options: { name: string; price_delta: number; is_default?: boolean }[]
  }[]
  combo_groups?: {
    name: string
    required: boolean
    min_items: number
    max_items: number
    source_type: string
    source_category_id?: string | null
    combo_options: { menu_item_id: string; menu_item?: { name: string } }[]
  }[]
}

type Category = {
  id: string
  name: string
  items: { id: string; name: string; base_price?: number }[]
}

const TABS = ['Basic', 'Options', 'Combo', 'Pricing'] as const

export function ItemForm({
  categoryId,
  product,
  allCategories,
  onClose,
}: {
  categoryId: string
  product: DbProduct | null
  allCategories: Category[]
  onClose: () => void
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Basic')
  const [saving, setSaving] = useState(false)

  const [basic, setBasic] = useState<BasicFormState>({
    name: product?.name ?? '',
    description: product?.description ?? '',
    categoryId: product?.category_id ?? categoryId,
    price: product ? (product.base_price / 100).toFixed(2) : '',
    imageUrl: product?.image_url ?? '',
    available: product?.available ?? true,
    featured: product?.featured ?? false,
    isBundle: product?.is_bundle ?? false,
    calories: product?.calories ? String(product.calories) : '',
    spiceLevel: product?.spice_level ?? null,
    isVegan: product?.is_vegan ?? false,
    isVegetarian: product?.is_vegetarian ?? false,
    isGlutenFree: product?.is_gluten_free ?? false,
    allergens: Array.isArray(product?.allergens) ? (product.allergens as string[]) : [],
  })

  const [optionGroups, setOptionGroups] = useState<OptionGroupForm[]>(
    (product?.option_groups ?? []).map((g) => ({
      name: g.name,
      group_type: g.group_type,
      required: g.required,
      min_selections: g.min_selections,
      max_selections: g.max_selections,
      options: g.options.map((o) => ({
        name: o.name,
        price: (o.price_delta / 100).toFixed(2),
        is_default: o.is_default,
      })),
    }))
  )

  const [comboGroups, setComboGroups] = useState<ComboGroupForm[]>(
    (product?.combo_groups ?? []).map((g) => ({
      name: g.name,
      required: g.required,
      min_items: g.min_items,
      max_items: g.max_items,
      source_type: g.source_type,
      source_category_id: g.source_category_id ?? '',
      combo_options: g.combo_options.map((o) => ({
        menu_item_id: o.menu_item_id,
        name: o.menu_item?.name ?? '',
      })),
    }))
  )

  const [pricingType, setPricingType] = useState<PricingType>(
    (product?.pricing_type as PricingType) ?? (product?.is_bundle ? 'BUNDLE' : 'OPTIONS')
  )

  const basePricePence = Math.round(parseFloat(basic.price || '0') * 100) || 0

  async function save() {
    setSaving(true)
    const payload = {
      category_id: basic.categoryId,
      name: basic.name,
      description: basic.description || null,
      price: basic.price,
      image_url: basic.imageUrl || null,
      available: basic.available,
      featured: basic.featured,
      is_bundle: basic.isBundle,
      calories: basic.calories ? Number(basic.calories) : null,
      spice_level: basic.spiceLevel,
      is_vegan: basic.isVegan,
      is_vegetarian: basic.isVegetarian,
      is_gluten_free: basic.isGlutenFree,
      allergens: basic.allergens,
      pricing_type: basic.isBundle ? 'BUNDLE' : pricingType,
      option_groups: optionGroups.map((g) => ({
        name: g.name,
        group_type: g.group_type,
        required: g.required,
        min_selections: g.min_selections,
        max_selections: g.max_selections,
        options: g.options.map((o) => ({
          name: o.name,
          price: o.price,
          is_default: o.is_default,
        })),
      })),
      combo_groups: basic.isBundle
        ? comboGroups.map((g) => ({
            name: g.name,
            required: g.required,
            min_items: g.min_items,
            max_items: g.max_items,
            source_type: g.source_type,
            source_category_id: g.source_category_id || null,
            combo_options: g.combo_options.map((o) => ({ menu_item_id: o.menu_item_id })),
          }))
        : [],
    }

    if (product) {
      await fetch(`/api/menu/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch('/api/menu/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }
    setSaving(false)
    onClose()
  }

  const visibleTabs = basic.isBundle ? TABS : TABS.filter((t) => t !== 'Combo')

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">{product ? 'Edit product' : 'Add product'}</h3>
          <div className="flex gap-1 mt-4">
            {visibleTabs.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  tab === t ? 'bg-violet-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'Basic' && (
            <ItemFormBasicTab state={basic} categories={allCategories} onChange={setBasic} />
          )}
          {tab === 'Options' && <ItemFormOptionsTab groups={optionGroups} onChange={setOptionGroups} />}
          {tab === 'Combo' && basic.isBundle && (
            <ItemFormComboTab groups={comboGroups} categories={allCategories} onChange={setComboGroups} />
          )}
          {tab === 'Pricing' && (
            <ItemFormPricingTab
              basePricePence={basePricePence}
              pricingType={pricingType}
              isBundle={basic.isBundle}
              optionGroups={optionGroups}
              onPricingTypeChange={setPricingType}
            />
          )}
        </div>
        <div className="p-6 border-t border-slate-800 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 text-slate-400">
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || !basic.name}
            className="flex-1 py-2 bg-violet-600 text-white rounded-lg disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
