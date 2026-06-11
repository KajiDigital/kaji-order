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
  spiceLevel: number | null
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
      <input
        placeholder="Name"
        value={state.name}
        onChange={(e) => set('name', e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
      />
      <textarea
        placeholder="Description"
        value={state.description}
        onChange={(e) => set('description', e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
        rows={2}
      />
      <label className="block text-sm text-slate-400">
        Category
        <select
          value={state.categoryId}
          onChange={(e) => set('categoryId', e.target.value)}
          className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm text-slate-400">
        Base price (£)
        <input
          value={state.price}
          onChange={(e) => set('price', e.target.value)}
          className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
        />
      </label>
      <input
        placeholder="Image URL"
        value={state.imageUrl}
        onChange={(e) => set('imageUrl', e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
      />
      <div className="flex flex-wrap gap-3 text-sm text-slate-300">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={state.isVegan} onChange={(e) => set('isVegan', e.target.checked)} />
          Vegan
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={state.isVegetarian} onChange={(e) => set('isVegetarian', e.target.checked)} />
          Vegetarian
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={state.isGlutenFree} onChange={(e) => set('isGlutenFree', e.target.checked)} />
          Gluten free
        </label>
      </div>
      <div>
        <p className="text-sm text-slate-400 mb-2">Allergens</p>
        <div className="flex flex-wrap gap-2">
          {ALLERGENS.map((a) => (
            <label key={a} className="flex items-center gap-1 text-xs text-slate-300 capitalize">
              <input type="checkbox" checked={state.allergens.includes(a)} onChange={() => toggleAllergen(a)} />
              {a}
            </label>
          ))}
        </div>
      </div>
      <label className="block text-sm text-slate-400">
        Spice level
        <select
          value={state.spiceLevel ?? ''}
          onChange={(e) => set('spiceLevel', e.target.value === '' ? null : Number(e.target.value))}
          className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
        >
          <option value="">None</option>
          <option value="1">Mild</option>
          <option value="2">Medium</option>
          <option value="3">Hot</option>
        </select>
      </label>
      <label className="block text-sm text-slate-400">
        Calories (optional)
        <input
          value={state.calories}
          onChange={(e) => set('calories', e.target.value)}
          className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
        />
      </label>
      <div className="flex flex-wrap gap-4 text-sm text-slate-300">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={state.featured} onChange={(e) => set('featured', e.target.checked)} />
          Featured
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={state.available} onChange={(e) => set('available', e.target.checked)} />
          Available
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={state.isBundle} onChange={(e) => set('isBundle', e.target.checked)} />
          Combo / bundle meal
        </label>
      </div>
    </div>
  )
}
