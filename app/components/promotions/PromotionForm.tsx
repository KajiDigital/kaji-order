'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  buildPromotionPreview,
  DAY_LABELS,
  penceToPoundsInput,
  poundsToPence,
  type MenuCategoryOption,
  type PromoScope,
} from '@/app/lib/promotion-config'
import { generateCouponCode } from '@/app/lib/promotions'

const PROMO_TYPES = [
  { value: 'PERCENTAGE_OFF', label: '% Off' },
  { value: 'FIXED_OFF', label: '£ Off' },
  { value: 'BUY_X_GET_Y', label: 'Buy X Get Y' },
  { value: 'FREE_ITEM', label: 'Free Item' },
  { value: 'HAPPY_HOUR', label: 'Happy Hour' },
] as const

export type PromotionFormState = {
  name: string
  description: string
  promo_type: string
  discount_pct: number
  discount_pence: number
  discount_pounds: string
  buy_quantity: number
  get_quantity: number
  applies_to: 'order' | 'category' | 'items'
  selectedCategoryIds: string[]
  selectedItemIds: string[]
  min_order_pence: number
  min_order_pounds: string
  valid_from: string
  valid_until: string
  days_of_week: number[]
  time_from: string
  time_until: string
  badge_text: string
  badge_color: string
  show_on_menu: boolean
  require_coupon: boolean
  coupon_code: string
  buyFromScope: PromoScope
  buyFromCategoryId: string
  buyFromItemIds: string[]
  getFromScope: PromoScope
  getFromCategoryId: string
  getFromItemIds: string[]
  freeItemMode: 'cheapest' | 'specific'
  freeItemScope: 'category' | 'item'
  freeItemCategoryId: string
  freeItemMenuItemId: string
  freeItemLimit: 'order' | 'daily'
}

export const emptyPromotionForm = (): PromotionFormState => ({
  name: '',
  description: '',
  promo_type: 'PERCENTAGE_OFF',
  discount_pct: 10,
  discount_pence: 500,
  discount_pounds: '5.00',
  buy_quantity: 2,
  get_quantity: 1,
  applies_to: 'order',
  selectedCategoryIds: [],
  selectedItemIds: [],
  min_order_pence: 0,
  min_order_pounds: '',
  valid_from: '',
  valid_until: '',
  days_of_week: [],
  time_from: '17:00',
  time_until: '19:00',
  badge_text: '',
  badge_color: '#ef4444',
  show_on_menu: true,
  require_coupon: false,
  coupon_code: '',
  buyFromScope: 'any',
  buyFromCategoryId: '',
  buyFromItemIds: [],
  getFromScope: 'same',
  getFromCategoryId: '',
  getFromItemIds: [],
  freeItemMode: 'specific',
  freeItemScope: 'item',
  freeItemCategoryId: '',
  freeItemMenuItemId: '',
  freeItemLimit: 'order',
})

function PreviewBox({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-violet-300 mb-2">{title}</p>
      {lines.filter(Boolean).map((line, index) => (
        <p key={index} className="text-sm text-violet-100">
          {line}
        </p>
      ))}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {children}
    </div>
  )
}

function inputClass() {
  return 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm'
}

function AppliesToRadios({
  value,
  onChange,
  categories,
  selectedCategoryIds,
  onCategoriesChange,
  selectedItemIds,
  onItemsChange,
}: {
  value: 'order' | 'category' | 'items'
  onChange: (v: 'order' | 'category' | 'items') => void
  categories: MenuCategoryOption[]
  selectedCategoryIds: string[]
  onCategoriesChange: (ids: string[]) => void
  selectedItemIds: string[]
  onItemsChange: (ids: string[]) => void
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {(
          [
            ['order', 'Entire order'],
            ['category', 'Specific categories'],
            ['items', 'Specific items'],
          ] as const
        ).map(([v, label]) => (
          <label key={v} className="flex items-center gap-2 text-sm text-slate-300">
            <input type="radio" checked={value === v} onChange={() => onChange(v)} />
            {label}
          </label>
        ))}
      </div>
      {value === 'category' && (
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
          {categories.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={selectedCategoryIds.includes(c.id)}
                onChange={(e) =>
                  onCategoriesChange(
                    e.target.checked
                      ? [...selectedCategoryIds, c.id]
                      : selectedCategoryIds.filter((id) => id !== c.id)
                  )
                }
              />
              {c.name}
            </label>
          ))}
        </div>
      )}
      {value === 'items' && (
        <div className="max-h-48 overflow-y-auto space-y-2">
          {categories.map((c) => (
            <div key={c.id}>
              <p className="text-xs text-slate-500 mb-1">{c.name}</p>
              <div className="grid grid-cols-1 gap-1">
                {c.items.map((item) => (
                  <label key={item.id} className="flex items-center gap-2 text-xs text-slate-400">
                    <input
                      type="checkbox"
                      checked={selectedItemIds.includes(item.id)}
                      onChange={(e) =>
                        onItemsChange(
                          e.target.checked
                            ? [...selectedItemIds, item.id]
                            : selectedItemIds.filter((id) => id !== item.id)
                        )
                      }
                    />
                    {item.name} — £{(item.price_pence / 100).toFixed(2)}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DayToggles({
  days,
  onChange,
}: {
  days: number[]
  onChange: (days: number[]) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {DAY_LABELS.map((label, idx) => (
        <button
          key={label}
          type="button"
          onClick={() =>
            onChange(days.includes(idx) ? days.filter((d) => d !== idx) : [...days, idx].sort())
          }
          className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
            days.includes(idx) ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function ScopeSelector({
  label,
  scope,
  onScopeChange,
  categoryId,
  onCategoryChange,
  itemIds,
  onItemsChange,
  categories,
  allowSame,
}: {
  label: string
  scope: PromoScope
  onScopeChange: (s: PromoScope) => void
  categoryId: string
  onCategoryChange: (id: string) => void
  itemIds: string[]
  onItemsChange: (ids: string[]) => void
  categories: MenuCategoryOption[]
  allowSame?: boolean
}) {
  return (
    <div className="space-y-2 rounded-lg border border-slate-800 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <div className="space-y-1">
        {allowSame && (
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="radio" checked={scope === 'same'} onChange={() => onScopeChange('same')} />
            Same items as above
          </label>
        )}
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="radio" checked={scope === 'any'} onChange={() => onScopeChange('any')} />
          Any items
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="radio" checked={scope === 'category'} onChange={() => onScopeChange('category')} />
          Specific category
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="radio" checked={scope === 'items'} onChange={() => onScopeChange('items')} />
          Specific items
        </label>
      </div>
      {scope === 'category' && (
        <select
          value={categoryId}
          onChange={(e) => onCategoryChange(e.target.value)}
          className={inputClass()}
        >
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}
      {scope === 'items' && (
        <div className="max-h-32 overflow-y-auto space-y-1">
          {categories.flatMap((c) =>
            c.items.map((item) => (
              <label key={item.id} className="flex items-center gap-2 text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={itemIds.includes(item.id)}
                  onChange={(e) =>
                    onItemsChange(
                      e.target.checked
                        ? [...itemIds, item.id]
                        : itemIds.filter((id) => id !== item.id)
                    )
                  }
                />
                {item.name}
              </label>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export function buildPayloadFromForm(form: PromotionFormState) {
  let applicable_ids: string[] | null = null
  if (form.applies_to === 'category') applicable_ids = form.selectedCategoryIds
  if (form.applies_to === 'items') applicable_ids = form.selectedItemIds

  const promo_config: Record<string, unknown> = {}

  if (form.promo_type === 'BUY_X_GET_Y') {
    promo_config.buyFrom = {
      scope: form.buyFromScope,
      ids:
        form.buyFromScope === 'category' && form.buyFromCategoryId
          ? [form.buyFromCategoryId]
          : form.buyFromScope === 'items'
            ? form.buyFromItemIds
            : [],
    }
    promo_config.getFrom = {
      scope: form.getFromScope,
      ids:
        form.getFromScope === 'category' && form.getFromCategoryId
          ? [form.getFromCategoryId]
          : form.getFromScope === 'items'
            ? form.getFromItemIds
            : [],
    }
    promo_config.freeItemMode = form.freeItemMode
  }

  if (form.promo_type === 'FREE_ITEM') {
    promo_config.freeItemScope = form.freeItemScope
    promo_config.freeItemCategoryId = form.freeItemCategoryId || undefined
    promo_config.freeItemMenuItemId = form.freeItemMenuItemId || undefined
    promo_config.freeItemLimit = form.freeItemLimit
  }

  return {
    name: form.name,
    description: form.description || null,
    promo_type: form.promo_type,
    discount_pct:
      form.promo_type === 'PERCENTAGE_OFF' || form.promo_type === 'HAPPY_HOUR'
        ? form.discount_pct
        : null,
    discount_pence: form.promo_type === 'FIXED_OFF' ? form.discount_pence : null,
    buy_quantity: form.promo_type === 'BUY_X_GET_Y' ? form.buy_quantity : null,
    get_quantity: form.promo_type === 'BUY_X_GET_Y' ? form.get_quantity : null,
    applies_to: form.applies_to,
    applicable_ids,
    promo_config: Object.keys(promo_config).length ? promo_config : null,
    min_order_pence: form.min_order_pence > 0 ? form.min_order_pence : null,
    valid_from: form.valid_from || null,
    valid_until: form.valid_until || null,
    days_of_week: form.days_of_week.length ? form.days_of_week : null,
    time_from: form.promo_type === 'HAPPY_HOUR' ? form.time_from : null,
    time_until: form.promo_type === 'HAPPY_HOUR' ? form.time_until : null,
    badge_text: form.badge_text || form.name,
    badge_color: form.badge_color,
    show_on_menu: form.show_on_menu,
    coupon_codes: form.require_coupon && form.coupon_code ? [form.coupon_code] : [],
  }
}

export function PromotionForm({
  form,
  setForm,
  categories,
}: {
  form: PromotionFormState
  setForm: (f: PromotionFormState) => void
  categories: MenuCategoryOption[]
}) {
  const preview = useMemo(
    () =>
      buildPromotionPreview(
        {
          promo_type: form.promo_type,
          discount_pct: form.discount_pct,
          discount_pence: form.discount_pence,
          buy_quantity: form.buy_quantity,
          get_quantity: form.get_quantity,
          applies_to: form.applies_to,
          min_order_pence: form.min_order_pence,
          days_of_week: form.days_of_week,
          time_from: form.time_from,
          time_until: form.time_until,
          name: form.name,
          badge_text: form.badge_text,
          promo_config: buildPayloadFromForm(form).promo_config,
        },
        { categories }
      ),
    [form, categories]
  )

  const allItems = useMemo(
    () => categories.flatMap((c) => c.items.map((i) => ({ ...i, categoryName: c.name }))),
    [categories]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {PROMO_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setForm({ ...form, promo_type: t.value })}
            className={`px-3 py-1.5 rounded-lg text-xs ${
              form.promo_type === t.value ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <input
        required
        placeholder="Promotion name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className={inputClass()}
      />
      <textarea
        placeholder="Description (shown to customer)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className={inputClass()}
        rows={2}
      />

      {form.promo_type === 'PERCENTAGE_OFF' && (
        <>
          <Section title="Discount percentage">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={100}
                value={form.discount_pct}
                onChange={(e) => setForm({ ...form, discount_pct: Number(e.target.value) })}
                className={`${inputClass()} w-24`}
              />
              <span className="text-slate-300 text-sm">% off</span>
            </div>
          </Section>
          <Section title="Applies to">
            <AppliesToRadios
              value={form.applies_to}
              onChange={(v) => setForm({ ...form, applies_to: v })}
              categories={categories}
              selectedCategoryIds={form.selectedCategoryIds}
              onCategoriesChange={(ids) => setForm({ ...form, selectedCategoryIds: ids })}
              selectedItemIds={form.selectedItemIds}
              onItemsChange={(ids) => setForm({ ...form, selectedItemIds: ids })}
            />
          </Section>
          <Section title="Conditions">
            <label className="block text-xs text-slate-400 mb-1">Minimum order (£)</label>
            <input
              type="text"
              placeholder="15.00"
              value={form.min_order_pounds}
              onChange={(e) =>
                setForm({
                  ...form,
                  min_order_pounds: e.target.value,
                  min_order_pence: poundsToPence(e.target.value),
                })
              }
              className={inputClass()}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={form.valid_from}
                onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                className={inputClass()}
              />
              <input
                type="date"
                value={form.valid_until}
                onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                className={inputClass()}
              />
            </div>
            <DayToggles
              days={form.days_of_week}
              onChange={(days) => setForm({ ...form, days_of_week: days })}
            />
          </Section>
          <PreviewBox
            title="Example preview"
            lines={[preview.example ?? preview.summary, preview.savingExample ?? ''].filter(Boolean) as string[]}
          />
        </>
      )}

      {form.promo_type === 'FIXED_OFF' && (
        <>
          <Section title="Discount amount">
            <div className="flex items-center gap-2">
              <span className="text-slate-300">£</span>
              <input
                type="text"
                value={form.discount_pounds}
                onChange={(e) =>
                  setForm({
                    ...form,
                    discount_pounds: e.target.value,
                    discount_pence: poundsToPence(e.target.value),
                  })
                }
                className={`${inputClass()} w-32`}
              />
              <span className="text-slate-300 text-sm">off</span>
            </div>
          </Section>
          <Section title="Applies to">
            <AppliesToRadios
              value={form.applies_to}
              onChange={(v) => setForm({ ...form, applies_to: v })}
              categories={categories}
              selectedCategoryIds={form.selectedCategoryIds}
              onCategoriesChange={(ids) => setForm({ ...form, selectedCategoryIds: ids })}
              selectedItemIds={form.selectedItemIds}
              onItemsChange={(ids) => setForm({ ...form, selectedItemIds: ids })}
            />
          </Section>
          <Section title="Conditions">
            <label className="block text-xs text-slate-400 mb-1">Minimum order (£)</label>
            <input
              type="text"
              placeholder="25.00"
              value={form.min_order_pounds}
              onChange={(e) =>
                setForm({
                  ...form,
                  min_order_pounds: e.target.value,
                  min_order_pence: poundsToPence(e.target.value),
                })
              }
              className={inputClass()}
            />
          </Section>
          <PreviewBox title="Example preview" lines={[preview.example ?? preview.summary]} />
        </>
      )}

      {form.promo_type === 'BUY_X_GET_Y' && (
        <>
          <Section title="Buy X Get Y Deal">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400">Buy quantity</label>
                <input
                  type="number"
                  min={1}
                  value={form.buy_quantity}
                  onChange={(e) => setForm({ ...form, buy_quantity: Number(e.target.value) })}
                  className={inputClass()}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Get quantity (free)</label>
                <input
                  type="number"
                  min={1}
                  value={form.get_quantity}
                  onChange={(e) => setForm({ ...form, get_quantity: Number(e.target.value) })}
                  className={inputClass()}
                />
              </div>
            </div>
            <ScopeSelector
              label="Buy from"
              scope={form.buyFromScope}
              onScopeChange={(s) => setForm({ ...form, buyFromScope: s })}
              categoryId={form.buyFromCategoryId}
              onCategoryChange={(id) => setForm({ ...form, buyFromCategoryId: id })}
              itemIds={form.buyFromItemIds}
              onItemsChange={(ids) => setForm({ ...form, buyFromItemIds: ids })}
              categories={categories}
            />
            <ScopeSelector
              label="Get from"
              scope={form.getFromScope}
              onScopeChange={(s) => setForm({ ...form, getFromScope: s })}
              categoryId={form.getFromCategoryId}
              onCategoryChange={(id) => setForm({ ...form, getFromCategoryId: id })}
              itemIds={form.getFromItemIds}
              onItemsChange={(ids) => setForm({ ...form, getFromItemIds: ids })}
              categories={categories}
              allowSame
            />
            <div className="space-y-2">
              <p className="text-xs text-slate-400">Which item is free</p>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="radio"
                  checked={form.freeItemMode === 'cheapest'}
                  onChange={() => setForm({ ...form, freeItemMode: 'cheapest' })}
                />
                Cheapest item (recommended)
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="radio"
                  checked={form.freeItemMode === 'specific'}
                  onChange={() => setForm({ ...form, freeItemMode: 'specific' })}
                />
                Specific item
              </label>
            </div>
          </Section>
          <PreviewBox
            title="Example preview"
            lines={[
              `Buy ${form.buy_quantity} get ${form.get_quantity} free`,
              'Buy 3 for the price of 2',
            ]}
          />
          <p className="text-xs text-slate-500">
            In basket: cheapest qualifying items are discounted automatically.
          </p>
        </>
      )}

      {form.promo_type === 'FREE_ITEM' && (
        <>
          <Section title="Free item when">
            <label className="block text-xs text-slate-400 mb-1">Minimum order (£)</label>
            <input
              type="text"
              placeholder="30.00"
              value={form.min_order_pounds}
              onChange={(e) =>
                setForm({
                  ...form,
                  min_order_pounds: e.target.value,
                  min_order_pence: poundsToPence(e.target.value),
                })
              }
              className={inputClass()}
            />
          </Section>
          <Section title="Free item">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="radio"
                  checked={form.freeItemScope === 'category'}
                  onChange={() => setForm({ ...form, freeItemScope: 'category' })}
                />
                Customer chooses from category
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="radio"
                  checked={form.freeItemScope === 'item'}
                  onChange={() => setForm({ ...form, freeItemScope: 'item' })}
                />
                Specific item
              </label>
            </div>
            {form.freeItemScope === 'category' && (
              <select
                value={form.freeItemCategoryId}
                onChange={(e) => setForm({ ...form, freeItemCategoryId: e.target.value })}
                className={inputClass()}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            {form.freeItemScope === 'item' && (
              <select
                value={form.freeItemMenuItemId}
                onChange={(e) => setForm({ ...form, freeItemMenuItemId: e.target.value })}
                className={inputClass()}
              >
                <option value="">Select item</option>
                {allItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} — £{(item.price_pence / 100).toFixed(2)}
                  </option>
                ))}
              </select>
            )}
          </Section>
          <Section title="Limit">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="radio"
                checked={form.freeItemLimit === 'order'}
                onChange={() => setForm({ ...form, freeItemLimit: 'order' })}
              />
              One per order
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="radio"
                checked={form.freeItemLimit === 'daily'}
                onChange={() => setForm({ ...form, freeItemLimit: 'daily' })}
              />
              One per customer per day
            </label>
          </Section>
          <PreviewBox title="Example preview" lines={[preview.example ?? preview.summary]} />
        </>
      )}

      {form.promo_type === 'HAPPY_HOUR' && (
        <>
          <Section title="Happy Hour discount">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={100}
                value={form.discount_pct}
                onChange={(e) => setForm({ ...form, discount_pct: Number(e.target.value) })}
                className={`${inputClass()} w-24`}
              />
              <span className="text-slate-300 text-sm">% off</span>
            </div>
          </Section>
          <Section title="During these times">
            <DayToggles
              days={form.days_of_week}
              onChange={(days) => setForm({ ...form, days_of_week: days })}
            />
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-slate-400">
                From
                <input
                  type="time"
                  value={form.time_from}
                  onChange={(e) => setForm({ ...form, time_from: e.target.value })}
                  className={`${inputClass()} mt-1`}
                />
              </label>
              <label className="text-xs text-slate-400">
                To
                <input
                  type="time"
                  value={form.time_until}
                  onChange={(e) => setForm({ ...form, time_until: e.target.value })}
                  className={`${inputClass()} mt-1`}
                />
              </label>
            </div>
          </Section>
          <Section title="Applies to">
            <AppliesToRadios
              value={form.applies_to === 'items' ? 'category' : form.applies_to}
              onChange={(v) => setForm({ ...form, applies_to: v === 'items' ? 'category' : v })}
              categories={categories}
              selectedCategoryIds={form.selectedCategoryIds}
              onCategoriesChange={(ids) => setForm({ ...form, selectedCategoryIds: ids })}
              selectedItemIds={form.selectedItemIds}
              onItemsChange={(ids) => setForm({ ...form, selectedItemIds: ids })}
            />
          </Section>
          <PreviewBox title="Example preview" lines={[preview.example ?? preview.summary]} />
        </>
      )}

      <Section title="Display &amp; coupon">
        <input
          placeholder="Badge text (menu)"
          value={form.badge_text}
          onChange={(e) => setForm({ ...form, badge_text: e.target.value })}
          className={inputClass()}
        />
        <input
          type="color"
          value={form.badge_color}
          onChange={(e) => setForm({ ...form, badge_color: e.target.value })}
          className="h-10 w-20 rounded"
        />
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={form.require_coupon}
            onChange={(e) => setForm({ ...form, require_coupon: e.target.checked })}
          />
          Require coupon code
        </label>
        {form.require_coupon && (
          <div className="flex gap-2">
            <input
              placeholder="SAVE10"
              value={form.coupon_code}
              onChange={(e) => setForm({ ...form, coupon_code: e.target.value.toUpperCase() })}
              className={`${inputClass()} font-mono`}
            />
            <button
              type="button"
              onClick={() => setForm({ ...form, coupon_code: generateCouponCode() })}
              className="px-3 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs shrink-0"
            >
              Generate
            </button>
          </div>
        )}
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={form.show_on_menu}
            onChange={(e) => setForm({ ...form, show_on_menu: e.target.checked })}
          />
          Show on menu
        </label>
      </Section>
    </div>
  )
}

export function usePromotionMenuData() {
  const [categories, setCategories] = useState<MenuCategoryOption[]>([])

  useEffect(() => {
    fetch('/api/dashboard/promotions/menu-data')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
  }, [])

  return categories
}

export { penceToPoundsInput }
