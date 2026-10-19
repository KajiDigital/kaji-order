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
      <p className="text-sm" style={{ color: 'var(--mb-muted)' }}>
        Base price: <strong style={{ color: 'var(--mb-text)' }}>{formatPence(basePricePence)}</strong>
      </p>
      {!isBundle && (
        <div className="space-y-2">
          <p className="menu-builder-label mb-0">Pricing type</p>
          {(['FIXED', 'OPTIONS'] as const).map((t) => (
            <label key={t} className="menu-builder-check-label">
              <input
                type="radio"
                name="pricing_type"
                checked={pricingType === t}
                onChange={() => onPricingTypeChange(t)}
              />
              {t === 'FIXED' && 'Fixed price (always base price)'}
              {t === 'OPTIONS' && 'Options affect price (base + choice deltas)'}
            </label>
          ))}
        </div>
      )}
      {isBundle && (
        <p
          className="text-sm rounded-lg px-3 py-2 border"
          style={{ background: '#fff7ed', borderColor: '#fed7aa', color: '#9a3412' }}
        >
          Set meal pricing: customer pays the base price regardless of course selections.
        </p>
      )}
      <div className="menu-builder-panel text-sm space-y-1">
        <p className="font-semibold">Price preview</p>
        {min === max ? (
          <p style={{ color: 'var(--mb-muted)' }}>Price: {formatPence(min)}</p>
        ) : (
          <>
            <p style={{ color: 'var(--mb-muted)' }}>
              Min: {formatPence(min)}
              {minLabel ? ` (${minLabel})` : ''}
            </p>
            <p style={{ color: 'var(--mb-muted)' }}>
              Max: {formatPence(max)}
              {maxLabel ? ` (${maxLabel})` : ''}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
