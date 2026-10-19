'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { parsePoundsToPence } from '@/app/lib/utils'
import {
  resizedMenuImageToDataUrl,
  resizeMenuImage,
  revokeMenuImagePreview,
} from '@/app/lib/menu-image'
import { ItemFormComboTab, type ComboGroupForm } from './ItemFormComboTab'
import {
  type OptionGroupForm,
} from './ItemFormOptionsTab'
import type { MenuBuilderItem } from './MenuItemCard'
import { ItemTagSections } from './ItemTagSections'
import type { MenuTagDto } from './TagSidebarPanel'

type Category = {
  id: string
  name: string
  items: { id: string; name: string; base_price?: number }[]
}

type Props = {
  item: MenuBuilderItem
  categoryId: string
  allCategories: Category[]
  isNew?: boolean
  onDone: () => void
  onCancel: () => void
  onDelete: (displayName?: string) => void
  onUpdated: () => void
  onTagsPoolChanged?: () => void
  showMenuImages?: boolean
}

function useAutoResizeTextarea(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const resize = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [])
  useEffect(() => {
    resize()
  }, [value, resize])
  return { ref, resize }
}

function groupTypeLabel(type: string) {
  if (type === 'MULTIPLE') return 'Choose several'
  if (type === 'OPTIONAL') return 'Optional extras'
  return 'Choose one'
}

function toOptionGroups(item: MenuBuilderItem): OptionGroupForm[] {
  return (item.option_groups ?? []).map((g) => ({
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
}

function toComboGroups(item: MenuBuilderItem): ComboGroupForm[] {
  return (item.combo_groups_detail ?? []).map((g) => ({
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
}

export function MenuItemInlineEditor({
  item,
  categoryId,
  allCategories,
  isNew = false,
  onDone,
  onCancel,
  onDelete,
  onUpdated,
  onTagsPoolChanged,
  showMenuImages = true,
}: Props) {
  const [saving, setSaving] = useState(false)
  const [tagPool, setTagPool] = useState<MenuTagDto[]>([])
  const [name, setName] = useState(item.name)
  const [description, setDescription] = useState(item.description ?? '')
  const [price, setPrice] = useState((item.base_price / 100).toFixed(2))
  const [imageUrl, setImageUrl] = useState(item.image_url ?? '')
  const [available, setAvailable] = useState(item.available)
  const [featured, setFeatured] = useState(item.featured)
  const [isBundle, setIsBundle] = useState(item.is_bundle)
  const [optionGroups, setOptionGroups] = useState<OptionGroupForm[]>(() => toOptionGroups(item))
  const [comboGroups, setComboGroups] = useState<ComboGroupForm[]>(() => toComboGroups(item))
  const [photoBusy, setPhotoBusy] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<string | null>(null)

  const { ref: descRef, resize: resizeDesc } = useAutoResizeTextarea(description)

  const dietaryTags = item.tag_links?.filter((l) => l.tag.kind === 'DIETARY') ?? []
  const allergenTags = item.tag_links?.filter((l) => l.tag.kind === 'ALLERGEN') ?? []

  async function loadTagPool() {
    const res = await fetch('/api/menu/tags')
    if (!res.ok) return
    const data = await res.json()
    setTagPool([...(data.dietary_tags ?? []), ...(data.allergen_tags ?? [])])
  }

  useEffect(() => {
    loadTagPool()
  }, [])

  useEffect(() => {
    return () => revokeMenuImagePreview(previewRef.current)
  }, [])

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return

    setPhotoBusy(true)
    try {
      revokeMenuImagePreview(previewRef.current)
      const resized = await resizeMenuImage(file)
      previewRef.current = resized.previewUrl
      const dataUrl = await resizedMenuImageToDataUrl(resized)
      setImageUrl(dataUrl)
    } catch {
      alert('Could not process that image. Try a JPG or PNG under 10MB.')
    } finally {
      setPhotoBusy(false)
    }
  }

  async function handleTagsPoolChanged() {
    await loadTagPool()
    onTagsPoolChanged?.()
  }

  function handleDelete() {
    onDelete(name.trim() || item.name)
  }

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    const payload = {
      category_id: categoryId,
      name: name.trim(),
      description: description || null,
      price,
      image_url: imageUrl || null,
      available,
      featured,
      is_bundle: isBundle,
      pricing_type: isBundle ? 'BUNDLE' : 'OPTIONS',
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
      combo_groups: isBundle
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

    if (isNew) {
      await fetch('/api/menu/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch(`/api/menu/products/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }
    setSaving(false)
    onUpdated()
    onDone()
  }

  function updateGroup(index: number, next: OptionGroupForm) {
    const copy = [...optionGroups]
    copy[index] = next
    setOptionGroups(copy)
  }

  function addOptionGroup() {
    setOptionGroups([
      ...optionGroups,
      {
        name: '',
        group_type: 'SINGLE',
        required: true,
        min_selections: 1,
        max_selections: 1,
        options: [{ name: '', price: '0.00' }],
      },
    ])
  }

  const pricePence = parsePoundsToPence(price)

  return (
    <div className="menu-builder-item-editor">
      <div className="menu-builder-item-editor-banner">
        <span className="menu-builder-item-editor-label">
          {isNew ? 'New item' : 'Editing item'}
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="menu-builder-item-editor-cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || !name.trim()}
            className="menu-builder-item-editor-done disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Done'}
          </button>
        </div>
      </div>

      <div
        className={`menu-builder-item-editor-body ${showMenuImages ? '' : 'menu-builder-item-editor-body--text-only'}`}
      >
        {showMenuImages && (
          <>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              aria-hidden
              onChange={handlePhotoSelect}
            />
            <button
              type="button"
              className="menu-builder-photo-upload menu-builder-item-editor-photo"
              disabled={photoBusy}
              onClick={() => photoInputRef.current?.click()}
            >
              {imageUrl ? (
                <img src={imageUrl} alt="" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <span className="text-xs text-center px-2" style={{ color: 'var(--mb-hint)' }}>
                  {photoBusy ? 'Processing…' : 'Tap to add photo'}
                </span>
              )}
            </button>
          </>
        )}

        <input
          className="menu-builder-field menu-builder-field--title menu-builder-item-editor-name"
          value={name}
          placeholder="Item name"
          onChange={(e) => setName(e.target.value)}
        />

        <div className="menu-builder-field menu-builder-field--price menu-builder-item-editor-price">
          <span className="menu-builder-item-editor-price-symbol">£</span>
          <input
            className="menu-builder-item-editor-price-input"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
          />
        </div>

        <textarea
          ref={descRef}
          className="menu-builder-field menu-builder-field--block menu-builder-desc menu-builder-item-editor-desc text-sm"
          style={{ color: 'var(--mb-muted)' }}
          value={description}
          placeholder="Add a short, tasty description…"
          rows={1}
          onChange={(e) => {
            setDescription(e.target.value)
            resizeDesc()
          }}
        />

        <div className="menu-builder-side-icons menu-builder-item-editor-icons">
          <button
            type="button"
            className="menu-builder-side-icon"
            data-kind="featured"
            data-active={featured}
            aria-label={featured ? 'Remove featured' : 'Mark as featured'}
            onClick={() => setFeatured(!featured)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={featured ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
          <button
            type="button"
            className="menu-builder-side-icon"
            data-active={available}
            aria-label={available ? 'Hide item' : 'Show item'}
            onClick={() => setAvailable(!available)}
          >
            {available ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            )}
          </button>
        </div>

        <div className="menu-builder-item-editor-tags">
          <ItemTagSections
            itemId={item.id}
            isNew={isNew}
            dietaryTags={dietaryTags}
            allergenTags={allergenTags}
            availableTags={tagPool}
            onUpdated={onUpdated}
            onPoolChanged={handleTagsPoolChanged}
          />
        </div>
      </div>

      {item.attribute_set_links?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.attribute_set_links.map((link) => (
            <div key={link.attribute_set_id} className="menu-builder-shared-set">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <p className="text-sm font-semibold truncate">{link.attribute_set.name}</p>
                <span className="menu-builder-shared-set-label">Shared</span>
              </div>
              <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--mb-muted)' }}>
                {link.attribute_set.choices?.map((c) => c.name).join(', ') ?? 'No choices'}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {optionGroups.map((g, gi) => (
        <div key={gi} className="menu-builder-choice-panel mt-4">
          <div className="flex items-start justify-between gap-2 mb-3 min-w-0">
            <input
              value={g.name}
              onChange={(e) => updateGroup(gi, { ...g, name: e.target.value })}
              placeholder="Choice name (e.g. Size, Extras)"
              className="menu-builder-field menu-builder-field--grow text-sm font-semibold min-w-0"
            />
            <button
              type="button"
              onClick={() => setOptionGroups(optionGroups.filter((_, i) => i !== gi))}
              className="p-1 rounded hover:bg-stone-100 shrink-0"
              style={{ color: 'var(--mb-muted)' }}
              aria-label="Remove choice group"
            >
              ×
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            {(['SINGLE', 'MULTIPLE', 'OPTIONAL'] as const).map((type) => (
              <button
                key={type}
                type="button"
                className="menu-builder-choice-type"
                data-active={g.group_type === type}
                onClick={() =>
                  updateGroup(gi, {
                    ...g,
                    group_type: type,
                    required: type !== 'OPTIONAL',
                    min_selections: type === 'OPTIONAL' ? 0 : 1,
                    max_selections: type === 'MULTIPLE' ? Math.max(g.max_selections, 2) : 1,
                  })
                }
              >
                {groupTypeLabel(type)}
              </button>
            ))}
            <button
              type="button"
              className="menu-builder-required-pill ml-auto"
              data-active={g.required}
              onClick={() => updateGroup(gi, { ...g, required: !g.required })}
            >
              ● Required
            </button>
          </div>

          <div className="space-y-2">
            {g.options.map((o, oi) => (
              <div key={oi} className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  className="menu-builder-side-icon shrink-0 !w-8 !h-8"
                  data-kind="featured"
                  data-active={o.is_default}
                  aria-label="Default choice"
                  onClick={() => {
                    const opts = g.options.map((opt, i) => ({
                      ...opt,
                      is_default: g.group_type === 'SINGLE' ? i === oi : i === oi ? !opt.is_default : opt.is_default,
                    }))
                    updateGroup(gi, { ...g, options: opts })
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={o.is_default ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
                <input
                  value={o.name}
                  onChange={(e) => {
                    const opts = [...g.options]
                    opts[oi] = { ...o, name: e.target.value }
                    updateGroup(gi, { ...g, options: opts })
                  }}
                  placeholder="Choice name"
                  className="menu-builder-field menu-builder-field--grow text-sm min-w-0"
                />
                <div className="menu-builder-field menu-builder-field--price flex items-center gap-1 shrink-0">
                  <span className="text-xs shrink-0" style={{ color: 'var(--mb-muted)' }}>+ £</span>
                  <input
                    value={o.price}
                    onChange={(e) => {
                      const opts = [...g.options]
                      opts[oi] = { ...o, price: e.target.value }
                      updateGroup(gi, { ...g, options: opts })
                    }}
                    className="w-full min-w-0 bg-transparent border-0 outline-none text-sm"
                    inputMode="decimal"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                updateGroup(gi, { ...g, options: [...g.options, { name: '', price: '0.00' }] })
              }
              className="text-sm font-semibold"
              style={{ color: 'var(--mb-accent)' }}
            >
              + Add choice
            </button>
          </div>
        </div>
      ))}

      <div className="mt-4 flex flex-col gap-2">
        <button type="button" onClick={addOptionGroup} className="menu-builder-add-item-btn">
          + Add a choice (size, extras…)
        </button>
        <button
          type="button"
          onClick={() => setIsBundle(!isBundle)}
          className="menu-builder-add-item-btn menu-builder-add-item-btn--muted"
        >
          {isBundle ? '✓ Set meal enabled' : '⊕ Make this a set meal'}
        </button>
      </div>

      {isBundle && (
        <div className="mt-4">
          <ItemFormComboTab groups={comboGroups} categories={allCategories} onChange={setComboGroups} />
        </div>
      )}

      <div
        className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t"
        style={{ borderColor: 'var(--mb-border)' }}
      >
        {!isNew && (
          <button type="button" onClick={handleDelete} className="text-sm font-medium" style={{ color: '#dc2626' }}>
            Delete item
          </button>
        )}
        <button type="button" onClick={onCancel} className="text-sm font-medium" style={{ color: 'var(--mb-muted)' }}>
          Cancel
        </button>
        <span className="text-sm ml-auto" style={{ color: 'var(--mb-muted)' }}>
          Customer pays £{(pricePence / 100).toFixed(2)}
        </span>
        <button
          type="button"
          onClick={save}
          disabled={saving || !name.trim()}
          className="menu-builder-btn-primary px-5 py-2 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Done'}
        </button>
      </div>
    </div>
  )
}
