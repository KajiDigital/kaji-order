'use client'

import { useState } from 'react'
import { formatPence } from '@/app/lib/utils'
import type { Product } from './menu-types'
import type { BasketModifier } from '@/app/lib/basket'

type Props = {
  product: Product
  primary: string
  onClose: () => void
  onAdd: (qty: number, modifiers: BasketModifier[], notes: string) => void
}

export function ProductModal({ product, primary, onClose, onAdd }: Props) {
  const [qty, setQty] = useState(1)
  const [notes, setNotes] = useState('')
  const [selectedMods, setSelectedMods] = useState<Record<string, string[]>>(() => {
    const defaults: Record<string, string[]> = {}
    product.modifier_groups.forEach((g) => {
      const def = g.modifiers.find((m) => m.is_default)
      if (def) defaults[g.id] = [def.id]
    })
    return defaults
  })

  const modifierTotal = Object.entries(selectedMods).reduce((sum, [groupId, modIds]) => {
    const group = product.modifier_groups.find((g) => g.id === groupId)
    if (!group) return sum
    return (
      sum +
      modIds.reduce((s, modId) => {
        const mod = group.modifiers.find((m) => m.id === modId)
        return s + (mod?.price_delta_pence ?? 0)
      }, 0)
    )
  }, 0)

  const lineTotal = (product.price_pence + modifierTotal) * qty

  function handleAdd() {
    const modifiers: BasketModifier[] = Object.entries(selectedMods).flatMap(
      ([groupId, modIds]) => {
        const group = product.modifier_groups.find((g) => g.id === groupId)
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
      }
    )
    onAdd(qty, modifiers, notes)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt=""
            className="h-48 w-full shrink-0 object-cover"
          />
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
              {product.description && (
                <p className="mt-1 text-sm text-stone-500">{product.description}</p>
              )}
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

          {product.modifier_groups.map((group) => (
            <div key={group.id} className="mt-5">
              <p className="text-sm font-semibold text-stone-800">
                {group.name}
                {group.required && <span className="text-red-500"> *</span>}
              </p>
              <div className="mt-2 space-y-1">
                {group.modifiers.map((mod) => {
                  const selected = selectedMods[group.id]?.includes(mod.id)
                  const isRadio = group.max_select === 1
                  return (
                    <label
                      key={mod.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                        selected ? 'border-stone-300 bg-stone-50' : 'border-stone-200'
                      }`}
                    >
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
                        className="accent-stone-800"
                      />
                      <span className="flex-1 text-stone-800">{mod.name}</span>
                      {mod.price_delta_pence !== 0 && (
                        <span className="text-stone-500">
                          {mod.price_delta_pence > 0 ? '+' : ''}
                          {formatPence(mod.price_delta_pence)}
                        </span>
                      )}
                    </label>
                  )
                })}
              </div>
            </div>
          ))}

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

          <input
            placeholder="Special instructions (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-4 w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-stone-400 focus:outline-none"
          />
        </div>

        <div className="border-t border-stone-100 p-4">
          <button
            type="button"
            onClick={handleAdd}
            disabled={!product.is_available}
            className="w-full rounded-xl py-3.5 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: primary }}
          >
            Add to basket · {formatPence(lineTotal)}
          </button>
        </div>
      </div>
    </div>
  )
}
