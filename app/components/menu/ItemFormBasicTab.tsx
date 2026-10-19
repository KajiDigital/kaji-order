'use client'

import { ALLERGENS } from '@/app/lib/menu-types'

export type BasicFormState = {
  name: string
  description: string
  categoryId: string
  price: string
  imageUrl: string
  available: boolean
  featured: boolean
  isBundle: boolean
  calories: string
  isVegan: boolean
  isVegetarian: boolean
  isGlutenFree: boolean
  allergens: string[]
}

type Props = {
  state: BasicFormState
  categories: { id: string; name: string }[]
  onChange: (next: BasicFormState) => void
}

export function ItemFormBasicTab({ state, categories, onChange }: Props) {
  function set<K extends keyof BasicFormState>(key: K, value: BasicFormState[K]) {
    onChange({ ...state, [key]: value })
  }

  function toggleAllergen(a: string) {
    set(
      'allergens',
      state.allergens.includes(a) ? state.allergens.filter((x) => x !== a) : [...state.allergens, a]
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="menu-builder-label">Name</label>
        <input
          className="menu-builder-input"
          placeholder="Item name"
          value={state.name}
          onChange={(e) => set('name', e.target.value)}
        />
      </div>
      <div>
        <label className="menu-builder-label">Description</label>
        <textarea
          className="menu-builder-input resize-y min-h-[72px]"
          placeholder="Short description for customers"
          value={state.description}
          onChange={(e) => set('description', e.target.value)}
          rows={2}
        />
      </div>
      <div>
        <label className="menu-builder-label">Category</label>
        <select
          className="menu-builder-input"
          value={state.categoryId}
          onChange={(e) => set('categoryId', e.target.value)}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="menu-builder-label">Base price (£)</label>
        <input
          className="menu-builder-input"
          value={state.price}
          onChange={(e) => set('price', e.target.value)}
          inputMode="decimal"
        />
      </div>
      <div>
        <label className="menu-builder-label">Image URL</label>
        <input
          className="menu-builder-input"
          placeholder="https://…"
          value={state.imageUrl}
          onChange={(e) => set('imageUrl', e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="menu-builder-check-label">
          <input type="checkbox" checked={state.isVegan} onChange={(e) => set('isVegan', e.target.checked)} />
          Vegan
        </label>
        <label className="menu-builder-check-label">
          <input type="checkbox" checked={state.isVegetarian} onChange={(e) => set('isVegetarian', e.target.checked)} />
          Vegetarian
        </label>
        <label className="menu-builder-check-label">
          <input type="checkbox" checked={state.isGlutenFree} onChange={(e) => set('isGlutenFree', e.target.checked)} />
          Gluten free
        </label>
      </div>
      <div>
        <p className="menu-builder-label">Allergens</p>
        <div className="flex flex-wrap gap-3">
          {ALLERGENS.map((a) => (
            <label key={a} className="menu-builder-check-label capitalize text-xs">
              <input type="checkbox" checked={state.allergens.includes(a)} onChange={() => toggleAllergen(a)} />
              {a}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="menu-builder-label">Calories (optional)</label>
        <input
          className="menu-builder-input"
          value={state.calories}
          onChange={(e) => set('calories', e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-4 pt-2 border-t" style={{ borderColor: 'var(--mb-border)' }}>
        <label className="menu-builder-check-label">
          <input type="checkbox" checked={state.featured} onChange={(e) => set('featured', e.target.checked)} />
          Featured
        </label>
        <label className="menu-builder-check-label">
          <input type="checkbox" checked={state.available} onChange={(e) => set('available', e.target.checked)} />
          Available
        </label>
        <label className="menu-builder-check-label">
          <input type="checkbox" checked={state.isBundle} onChange={(e) => set('isBundle', e.target.checked)} />
          Set meal / bundle
        </label>
      </div>
    </div>
  )
}
