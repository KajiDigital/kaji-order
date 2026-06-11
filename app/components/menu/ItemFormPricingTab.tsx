'use client'

import { formatPence } from '@/app/lib/utils'
import { calcMinMaxPrice } from '@/app/lib/menu-pricing'
import type { MenuProduct, PricingType } from '@/app/lib/menu-types'
import type { OptionGroupForm } from './ItemFormOptionsTab'

type Props = {
  basePricePence: number
  pricingType: PricingType
  isBundle: boolean
  optionGroups: OptionGroupForm[]
  onPricingTypeChange: (type: PricingType) => void
}

export function ItemFormPricingTab({
  basePricePence,
  pricingType,
  isBundle,
  optionGroups,
  onPricingTypeChange,
}: Props) {
  const previewProduct: MenuProduct = {
    id: 'preview',
    name: '',
    base_price: basePricePence,
    available: true,
    pricing_type: isBundle ? 'BUNDLE' : pricingType,
    is_bundle: isBundle,
    option_groups: optionGroups.map((g, i) => ({
      id: String(i),
      name: g.name,
      group_type: g.group_type as MenuProduct['option_groups'][0]['group_type'],
      required: g.required,
      min_selections: g.min_selections,
      max_selections: g.max_selections,
      options: g.options.map((o, oi) => ({
        id: String(oi),
        name: o.name || 'Option',
        price_delta: Math.round(parseFloat(o.price || '0') * 100) || 0,
        is_default: o.is_default,
      })),
    })),
    combo_groups: [],
  }

  const { min, max, minLabel, maxLabel } = calcMinMaxPrice(previewProduct)

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">Base price: {formatPence(basePricePence)}</p>
      {!isBundle && (
        <div className="space-y-2 text-sm">
          <p className="text-slate-400">Pricing type</p>
          {(['FIXED', 'OPTIONS'] as const).map((t) => (
            <label key={t} className="flex items-center gap-2 text-slate-300">
              <input
                type="radio"
                name="pricing_type"
                checked={pricingType === t}
                onChange={() => onPricingTypeChange(t)}
              />
              {t === 'FIXED' && 'Fixed price (base price always)'}
              {t === 'OPTIONS' && 'Options affect price (base + option deltas)'}
            </label>
          ))}
        </div>
      )}
      {isBundle && (
        <p className="text-sm text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          Bundle pricing: customer pays the base price regardless of combo selections.
        </p>
      )}
      <div className="bg-slate-800 rounded-lg p-4 text-sm text-slate-300 space-y-1">
        <p className="font-medium text-white">Price preview</p>
        {min === max ? (
          <p>Price: {formatPence(min)}</p>
        ) : (
          <>
            <p>
              Min price: {formatPence(min)}
              {minLabel ? ` (${minLabel})` : ''}
            </p>
            <p>
              Max price: {formatPence(max)}
              {maxLabel ? ` (${maxLabel})` : ''}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
