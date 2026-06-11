'use client'

import { useMemo, useState } from 'react'
import { formatPence } from '@/app/lib/utils'
import type { Product } from './menu-types'
import type { BasketSelection } from '@/app/lib/basket'
import { calcLineTotal, displayOptionPrice } from '@/app/lib/menu-pricing'
import {
  buildComboSelection,
  buildOptionSelection,
  validateSelections,
} from '@/app/lib/menu-selections'

type Props = {
  product: Product
  primary: string
  canOrder?: boolean
  onClose: () => void
  onAdd: (
    qty: number,
    selections: BasketSelection[],
    notes: string,
    pricing: { options_price: number; total_price: number }
  ) => void
}

function spiceIcons(level: number | null | undefined) {
  if (!level) return null
  return '🌶'.repeat(Math.min(level, 3))
}

export function ProductModal({ product, primary, canOrder = true, onClose, onAdd }: Props) {
  const [qty, setQty] = useState(1)
  const [notes, setNotes] = useState('')
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>(() => {
    const defaults: Record<string, string[]> = {}
    product.option_groups.forEach((g) => {
      const def = g.options.find((o) => o.is_default)
      if (def) defaults[g.id] = [def.id]
    })
    return defaults
  })
  const [selectedCombos, setSelectedCombos] = useState<Record<string, string>>({})

  const selections = useMemo(() => {
    const result: BasketSelection[] = []
    for (const group of product.option_groups) {
      const ids = selectedOptions[group.id] ?? []
      for (const id of ids) {
        const sel = buildOptionSelection(group, id)
        if (sel) result.push(sel)
      }
    }
    for (const group of product.combo_groups) {
      const itemId = selectedCombos[group.id]
      if (itemId) {
        const opt = group.combo_options.find((o) => o.menu_item_id === itemId)
        if (opt) result.push(buildComboSelection(group, itemId, opt.name))
      }
    }
    return result
  }, [product, selectedOptions, selectedCombos])

  const pricingType = product.pricing_type ?? (product.is_bundle ? 'BUNDLE' : 'OPTIONS')
  const { options_price, total_price } = calcLineTotal(product.base_price, pricingType, selections, qty)
  const errors = validateSelections(product, selections)
  const errorGroupIds = new Set(errors.map((e) => e.group_id))

  function handleAdd() {
    if (errors.length > 0) return
    onAdd(qty, selections, notes, { options_price, total_price })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl">
        {product.image_url ? (
          <img src={product.image_url} alt="" className="h-48 w-full shrink-0 object-cover" />
        ) : (
          <div className="flex h-48 shrink-0 items-center justify-center bg-stone-100 text-stone-400">
            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-stone-900">{product.name}</h2>
              {product.description && <p className="mt-1 text-sm text-stone-500">{product.description}</p>}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {product.is_vegan && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">V</span>}
                {product.is_vegetarian && !product.is_vegan && (
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">Ve</span>
                )}
                {product.is_gluten_free && (
                  <span className="text-xs bg-amber-50 text-amber-800 px-2 py-0.5 rounded">GF</span>
                )}
                {product.spice_level ? (
                  <span className="text-xs text-stone-600">{spiceIcons(product.spice_level)}</span>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              aria-label="Close"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {product.option_groups.map((group) => {
            const isRadio = group.group_type === 'SINGLE' || group.max_selections === 1
            const hasError = errorGroupIds.has(group.id)
            return (
              <div key={group.id} className={`mt-5 ${hasError ? 'rounded-lg border border-red-300 p-2' : ''}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-stone-800">{group.name}</p>
                  <span className="text-xs text-stone-500">
                    {group.required ? 'Required' : 'Optional'}
                  </span>
                </div>
                {hasError && <p className="text-xs text-red-500 mt-1">Please make a selection</p>}
                <div className="mt-2 space-y-1">
                  {group.options.filter((o) => o.available !== false).map((opt) => {
                    const selected = selectedOptions[group.id]?.includes(opt.id)
                    const rowPrice = displayOptionPrice(product.base_price, opt.price_delta, pricingType)
                    return (
                      <label
                        key={opt.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                          selected ? 'border-stone-300 bg-stone-50' : 'border-stone-200'
                        }`}
                      >
                        <input
                          type={isRadio ? 'radio' : 'checkbox'}
                          name={group.id}
                          checked={selected}
                          disabled={!canOrder}
                          onChange={() => {
                            if (isRadio) {
                              setSelectedOptions({ ...selectedOptions, [group.id]: [opt.id] })
                            } else {
                              const current = selectedOptions[group.id] ?? []
                              const next = selected
                                ? current.filter((id) => id !== opt.id)
                                : [...current, opt.id]
                              setSelectedOptions({ ...selectedOptions, [group.id]: next })
                            }
                          }}
                          className="accent-stone-800"
                        />
                        <span className="flex-1 text-stone-800">{opt.name}</span>
                        <span className="text-stone-600 font-medium">{formatPence(rowPrice)}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {product.combo_groups.map((group) => {
            const hasError = errorGroupIds.has(group.id)
            return (
              <div key={group.id} className={`mt-5 ${hasError ? 'rounded-lg border border-red-300 p-2' : ''}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-stone-800">{group.name}</p>
                  <span className="text-xs text-stone-500">{group.required ? 'Required' : 'Optional'}</span>
                </div>
                {hasError && <p className="text-xs text-red-500 mt-1">Please make a selection</p>}
                <div className="mt-2 space-y-1">
                  {group.combo_options.map((opt) => {
                    const selected = selectedCombos[group.id] === opt.menu_item_id
                    return (
                      <label
                        key={opt.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                          selected ? 'border-stone-300 bg-stone-50' : 'border-stone-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name={group.id}
                          checked={selected}
                          disabled={!canOrder}
                          onChange={() => setSelectedCombos({ ...selectedCombos, [group.id]: opt.menu_item_id })}
                          className="accent-stone-800"
                        />
                        <span className="flex-1 text-stone-800">{opt.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {canOrder && (
            <>
              <div className="mt-5">
                <p className="text-sm font-medium text-stone-700 mb-2">Special instructions</p>
                <input
                  placeholder="Add a note..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-stone-400 focus:outline-none"
                />
              </div>
              <div className="mt-5 flex items-center gap-4">
                <span className="text-sm font-medium text-stone-700">Quantity</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-lg font-medium text-stone-700 hover:bg-stone-50"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-semibold">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(qty + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-lg font-medium text-stone-700 hover:bg-stone-50"
                  >
                    +
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="border-t border-stone-100 p-4">
          {canOrder ? (
            <button
              type="button"
              onClick={handleAdd}
              disabled={!product.available || errors.length > 0}
              className="w-full rounded-xl py-3.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: primary }}
            >
              Add to order · {formatPence(total_price)}
            </button>
          ) : (
            <p className="text-center text-sm text-stone-500">
              {!product.available
                ? 'This item is currently unavailable.'
                : 'Ordering is unavailable while the restaurant is closed.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
