'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatPence } from '@/app/lib/utils'
import {
  type BasketItem,
  basketItemCount,
  basketSubtotal,
  getBasket,
  saveBasket,
} from '@/app/lib/basket'

type Modifier = { id: string; name: string; price_delta_pence: number; is_default?: boolean }
type ModifierGroup = {
  id: string
  name: string
  required: boolean
  min_select: number
  max_select: number
  modifiers: Modifier[]
}
type Product = {
  id: string
  name: string
  description?: string | null
  price_pence: number
  image_url?: string | null
  modifier_groups: ModifierGroup[]
}
type Category = { id: string; name: string; color: string; items: Product[] }
type Restaurant = {
  slug: string
  name: string
  description?: string | null
  logo_url?: string | null
  banner_url?: string | null
  brand_color: string
  isOpen: boolean
  closedReason?: string
  holiday_mode: boolean
  holiday_message?: string | null
  min_order_pence: number
  avg_prep_minutes: number
}

export function PublicMenuClient({
  restaurant,
  categories,
}: {
  restaurant: Restaurant
  categories: Category[]
}) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? '')
  const [basket, setBasket] = useState<BasketItem[]>([])
  const [modalProduct, setModalProduct] = useState<Product | null>(null)
  const [qty, setQty] = useState(1)
  const [notes, setNotes] = useState('')
  const [selectedMods, setSelectedMods] = useState<Record<string, string[]>>({})

  useEffect(() => {
    const stored = getBasket(restaurant.slug)
    if (stored?.items) setBasket(stored.items)
  }, [restaurant.slug])

  useEffect(() => {
    if (basket.length > 0) {
      saveBasket(restaurant.slug, {
        items: basket,
        restaurantSlug: restaurant.slug,
        updatedAt: new Date().toISOString(),
      })
    }
  }, [basket, restaurant.slug])

  const activeItems = categories.find((c) => c.id === activeCategory)?.items ?? []
  const subtotal = basketSubtotal(basket)
  const count = basketItemCount(basket)

  function addToBasket() {
    if (!modalProduct) return

    const modifiers = Object.entries(selectedMods).flatMap(([groupId, modIds]) => {
      const group = modalProduct.modifier_groups.find((g) => g.id === groupId)
      if (!group) return []
      return modIds.map((modId) => {
        const mod = group.modifiers.find((m) => m.id === modId)!
        return {
          groupId,
          groupName: group.name,
          modifierId: modId,
          name: mod.name,
          priceDeltaPence: mod.price_delta_pence,
        }
      })
    })

    const item: BasketItem = {
      id: `${modalProduct.id}-${Date.now()}`,
      menuItemId: modalProduct.id,
      name: modalProduct.name,
      pricePence: modalProduct.price_pence,
      quantity: qty,
      modifiers,
      notes: notes || undefined,
    }

    setBasket([...basket, item])
    setModalProduct(null)
    setQty(1)
    setNotes('')
    setSelectedMods({})
  }

  if (!restaurant.isOpen) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="text-center max-w-md">
          {restaurant.logo_url && (
            <img src={restaurant.logo_url} alt="" className="w-20 h-20 mx-auto rounded-xl mb-4 object-cover" />
          )}
          <h1 className="text-2xl font-bold text-slate-900">{restaurant.name}</h1>
          <p className="mt-4 text-slate-600">
            {restaurant.holiday_mode && restaurant.holiday_message
              ? restaurant.holiday_message
              : 'We&apos;re currently closed. Please check back during opening hours.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {restaurant.banner_url && (
        <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url(${restaurant.banner_url})` }} />
      )}
      <header className="bg-white border-b px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          {restaurant.logo_url && (
            <img src={restaurant.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900">{restaurant.name}</h1>
            {restaurant.description && (
              <p className="text-sm text-slate-500 line-clamp-2">{restaurant.description}</p>
            )}
          </div>
          <span className="ml-auto text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Open</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium ${
                activeCategory === cat.id ? 'text-white' : 'bg-white text-slate-600 border'
              }`}
              style={activeCategory === cat.id ? { backgroundColor: cat.color } : undefined}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
          {activeItems.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => {
                setModalProduct(product)
                const defaults: Record<string, string[]> = {}
                product.modifier_groups.forEach((g) => {
                  const def = g.modifiers.find((m) => m.is_default)
                  if (def) defaults[g.id] = [def.id]
                })
                setSelectedMods(defaults)
              }}
              className="bg-white rounded-xl border text-left overflow-hidden hover:shadow-md transition-shadow"
            >
              {product.image_url ? (
                <img src={product.image_url} alt="" className="w-full h-28 object-cover" />
              ) : (
                <div className="w-full h-28 bg-slate-100" />
              )}
              <div className="p-3">
                <p className="font-medium text-slate-900 text-sm">{product.name}</p>
                {product.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{product.description}</p>
                )}
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm font-semibold" style={{ color: restaurant.brand_color }}>
                    {formatPence(product.price_pence)}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100">+ Add</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {count > 0 && (
        <Link
          href={`/${restaurant.slug}/basket`}
          className="fixed bottom-4 left-4 right-4 max-w-3xl mx-auto block text-center py-3 rounded-xl text-white font-medium shadow-lg"
          style={{ backgroundColor: restaurant.brand_color }}
        >
          Basket · {count} items · {formatPence(subtotal)}
        </Link>
      )}

      {modalProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold text-slate-900">{modalProduct.name}</h2>
            {modalProduct.description && (
              <p className="text-slate-600 text-sm mt-1">{modalProduct.description}</p>
            )}
            {modalProduct.modifier_groups.map((group) => (
              <div key={group.id} className="mt-4">
                <p className="text-sm font-medium text-slate-700">
                  {group.name}
                  {group.required && ' *'}
                </p>
                <div className="space-y-1 mt-2">
                  {group.modifiers.map((mod) => {
                    const selected = selectedMods[group.id]?.includes(mod.id)
                    const isRadio = group.max_select === 1
                    return (
                      <label key={mod.id} className="flex items-center gap-2 text-sm">
                        <input
                          type={isRadio ? 'radio' : 'checkbox'}
                          name={group.id}
                          checked={selected}
                          onChange={() => {
                            if (isRadio) {
                              setSelectedMods({ ...selectedMods, [group.id]: [mod.id] })
                            } else {
                              const current = selectedMods[group.id] ?? []
                              setSelectedMods({
                                ...selectedMods,
                                [group.id]: selected
                                  ? current.filter((id) => id !== mod.id)
                                  : [...current, mod.id],
                              })
                            }
                          }}
                        />
                        {mod.name}
                        {mod.price_delta_pence > 0 && (
                          <span className="text-slate-500">+{formatPence(mod.price_delta_pence)}</span>
                        )}
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm">Qty</span>
              <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 rounded bg-slate-100">-</button>
              <span>{qty}</span>
              <button type="button" onClick={() => setQty(qty + 1)} className="w-8 h-8 rounded bg-slate-100">+</button>
            </div>
            <input
              placeholder="Item notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full mt-3 border rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={addToBasket}
              className="w-full mt-4 py-3 rounded-xl text-white font-medium"
              style={{ backgroundColor: restaurant.brand_color }}
            >
              Add to basket {formatPence(modalProduct.price_pence * qty)}
            </button>
            <button type="button" onClick={() => setModalProduct(null)} className="w-full mt-2 py-2 text-slate-500 text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
