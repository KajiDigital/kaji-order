'use client'

import { useEffect, useRef, useState } from 'react'
import type { MenuBuilderItem } from './MenuItemCard'
import { EMPTY_DRAFT_ITEM, MenuItemCard } from './MenuItemCard'
import { MenuItemInlineEditor } from './MenuItemInlineEditor'
import { CategoryOrderButtons } from './CategoryOrderButtons'
import { CategoryTitle } from './CategoryTitle'
import { CollapsiblePanel } from './CollapsiblePanel'
import { DragHandle } from './DragHandle'
import { CategoryModal } from './CategoryModal'
import {
  OptionSetModal,
  attributeSetToForm,
  optionSetFormToPayload,
  type OptionSetForm,
} from './OptionSetModal'
import { TagModal, type MenuTagForm } from './TagModal'
import { TagSidebarPanel, type MenuTagDto } from './TagSidebarPanel'
import { MenuPreview } from './MenuPreview'
import { ConfirmDialog } from './ConfirmDialog'
import { MenuBuilderHeaderToggle } from './MenuBuilderHeaderToggle'
import type { MenuTagKind } from '@/app/lib/menu-tags'

export const ALL_ITEMS_ID = '__all__'

export type AttributeSetDto = {
  id: string
  name: string
  description?: string | null
  group_type: string
  required: boolean
  min_selections: number
  max_selections: number
  sort_order: number
  choices: {
    id: string
    name: string
    price_delta: number
    is_default: boolean
    available: boolean
  }[]
  linked_item_ids: string[]
}

type Category = {
  id: string
  name: string
  color: string
  is_active: boolean
  sort_order: number
  items: MenuBuilderItem[]
}

function groupTypeBadge(type: string) {
  if (type === 'MULTIPLE') return 'Choose several'
  if (type === 'OPTIONAL') return 'Optional extras'
  return 'Choose one'
}

function normalizeBuilderItem(raw: Record<string, unknown>): MenuBuilderItem {
  const item = raw as MenuBuilderItem & {
    combo_groups?: MenuBuilderItem['combo_groups_detail']
  }
  const comboGroups = item.combo_groups ?? []
  return {
    ...item,
    combo_groups: comboGroups.map((g) => ({ id: g.id, name: g.name })),
    combo_groups_detail: comboGroups as MenuBuilderItem['combo_groups_detail'],
    option_groups: item.option_groups ?? [],
  }
}

type Props = {
  restaurantName?: string
  restaurantSlug?: string
}

export function MenuBuilder({ restaurantName = 'Your restaurant', restaurantSlug = '' }: Props) {
  const [categories, setCategories] = useState<Category[]>([])
  const [attributeSets, setAttributeSets] = useState<AttributeSetDto[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(ALL_ITEMS_ID)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [categoriesOpen, setCategoriesOpen] = useState(true)
  const [optionSetsOpen, setOptionSetsOpen] = useState(true)
  const [dietaryTagsOpen, setDietaryTagsOpen] = useState(true)
  const [allergenTagsOpen, setAllergenTagsOpen] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [tagModalKind, setTagModalKind] = useState<MenuTagKind>('DIETARY')
  const [editingTag, setEditingTag] = useState<MenuTagForm | null>(null)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingSet, setEditingSet] = useState<OptionSetForm | null>(null)
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)
  const [draftCategoryId, setDraftCategoryId] = useState<string | null>(null)
  const [dietaryTags, setDietaryTags] = useState<MenuTagDto[]>([])
  const [allergenTags, setAllergenTags] = useState<MenuTagDto[]>([])
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile')
  const [previewKey, setPreviewKey] = useState(0)
  const [showMenuImages, setShowMenuImages] = useState(true)
  const [collectionEnabled, setCollectionEnabled] = useState(true)
  const [deliveryEnabled, setDeliveryEnabled] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [collapsedCategoryIds, setCollapsedCategoryIds] = useState<Set<string>>(() => new Set())
  const [confirmState, setConfirmState] = useState<{
    title: string
    message: string
    confirmLabel: string
    onConfirm: () => void
  } | null>(null)
  const draftEditorRef = useRef<HTMLDivElement>(null)

  function openConfirm(opts: {
    title?: string
    message: string
    confirmLabel?: string
    onConfirm: () => void
  }) {
    setConfirmState({
      title: opts.title ?? 'Are you sure?',
      message: opts.message,
      confirmLabel: opts.confirmLabel ?? 'Delete',
      onConfirm: opts.onConfirm,
    })
  }

  async function loadRestaurantSettings() {
    const res = await fetch('/api/restaurant/settings')
    if (!res.ok) return
    const data = await res.json()
    const restaurant = data.restaurant
    if (!restaurant) return
    setShowMenuImages(restaurant.show_menu_images !== false)
    setCollectionEnabled(restaurant.collection_enabled !== false)
    setDeliveryEnabled(Boolean(restaurant.delivery_enabled))
  }

  async function saveRestaurantSetting(
    patch: Partial<{
      show_menu_images: boolean
      collection_enabled: boolean
      delivery_enabled: boolean
    }>
  ) {
    if (patch.collection_enabled === false && !deliveryEnabled && patch.delivery_enabled !== true) {
      return
    }
    if (patch.delivery_enabled === false && !collectionEnabled && patch.collection_enabled !== true) {
      return
    }

    setSettingsSaving(true)
    const res = await fetch('/api/restaurant/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    setSettingsSaving(false)
    if (!res.ok) return

    const data = await res.json()
    const restaurant = data.restaurant
    if (!restaurant) return

    setShowMenuImages(restaurant.show_menu_images !== false)
    setCollectionEnabled(restaurant.collection_enabled !== false)
    setDeliveryEnabled(Boolean(restaurant.delivery_enabled))
    setPreviewKey((k) => k + 1)

    if (patch.delivery_enabled === true) {
      void fetch('/api/restaurant/delivery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          radius_km: 5,
          delivery_fee_pence: 299,
          minimum_order_pence: 0,
          delivery_from: '17:00',
        }),
      })
    }
  }

  async function load() {
    const [catRes, setRes, tagRes] = await Promise.all([
      fetch('/api/menu/categories'),
      fetch('/api/menu/attribute-sets'),
      fetch('/api/menu/tags'),
    ])
    const catData = await catRes.json()
    const setData = await setRes.json()
    const tagData = await tagRes.json()
    setCategories(
      (catData.categories ?? []).map((cat: Category & { items: Record<string, unknown>[] }) => ({
        ...cat,
        items: (cat.items ?? []).map(normalizeBuilderItem),
      }))
    )
    setAttributeSets(setData.attribute_sets ?? [])
    setDietaryTags(tagData.dietary_tags ?? [])
    setAllergenTags(tagData.allergen_tags ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
    void loadRestaurantSettings()
  }, [])

  useEffect(() => {
    if (mode !== 'preview') return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMode('edit')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mode])

  useEffect(() => {
    if (!draftCategoryId) return
    const timer = window.setTimeout(() => {
      draftEditorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
    return () => window.clearTimeout(timer)
  }, [draftCategoryId])

  function enterPreview() {
    setExpandedItemId(null)
    setDraftCategoryId(null)
    setPreviewDevice('mobile')
    setPreviewKey((k) => k + 1)
    setMode('preview')
  }

  const itemCount = categories.reduce((n, c) => n + c.items.length, 0)
  const query = search.trim().toLowerCase()

  const selectedCategory =
    selectedCategoryId === ALL_ITEMS_ID
      ? null
      : categories.find((c) => c.id === selectedCategoryId) ?? null

  const allItems: MenuBuilderItem[] = categories.flatMap((c) => c.items)

  const baseItems =
    selectedCategoryId === ALL_ITEMS_ID
      ? allItems
      : (selectedCategory?.items ?? [])

  const visibleItems = filterItemsBySearch(baseItems)

  const groupedCategories =
    selectedCategoryId === ALL_ITEMS_ID
      ? categories
          .map((cat) => ({
            category: cat,
            items: filterItemsBySearch(cat.items),
          }))
          .filter((g) => g.items.length > 0 || !query || draftCategoryId === g.category.id)
      : []

  const categoryOptions = categories.map((c) => ({
    id: c.id,
    name: c.name,
    items: c.items.map((i) => ({ id: i.id, name: i.name, base_price: i.base_price })),
  }))

  async function saveOptionSet(form: OptionSetForm) {
    const payload = optionSetFormToPayload(form)
    if (form.id) {
      await fetch(`/api/menu/attribute-sets/${form.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch('/api/menu/attribute-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }
    await load()
  }

  async function deleteOptionSetById(id: string) {
    await fetch(`/api/menu/attribute-sets/${id}`, { method: 'DELETE' })
    await load()
  }

  async function deleteOptionSet() {
    if (!editingSet?.id) return
    await deleteOptionSetById(editingSet.id)
  }

  async function saveTag(form: MenuTagForm) {
    const payload = { name: form.name, color: form.color, kind: form.kind }
    if (form.id) {
      await fetch(`/api/menu/tags/${form.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch('/api/menu/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }
    await load()
  }

  async function deleteTagById(id: string) {
    await fetch(`/api/menu/tags/${id}`, { method: 'DELETE' })
    await load()
  }

  function openNewTag(kind: MenuTagKind) {
    setTagModalKind(kind)
    setEditingTag(null)
    setTagModalOpen(true)
  }

  function openEditTag(tag: MenuTagDto) {
    setTagModalKind(tag.kind)
    setEditingTag({ id: tag.id, name: tag.name, color: tag.color, kind: tag.kind })
    setTagModalOpen(true)
  }

  async function createCategory(name: string, color: string) {
    const res = await fetch('/api/menu/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color }),
    })
    if (!res.ok) throw new Error('Failed')
    const data = await res.json()
    await load()
    if (data.category?.id) setSelectedCategoryId(data.category.id)
  }

  async function toggleCategoryActive(cat: Category) {
    await fetch(`/api/menu/categories/${cat.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !cat.is_active }),
    })
    await load()
  }

  async function removeCategory(cat: Category) {
    await fetch(`/api/menu/categories/${cat.id}`, { method: 'DELETE' })
    if (selectedCategoryId === cat.id) setSelectedCategoryId(ALL_ITEMS_ID)
    await load()
  }

  function deleteCategory(cat: Category) {
    openConfirm({
      title: 'Delete category',
      message: `Delete “${cat.name}” and all its items? This can’t be undone.`,
      confirmLabel: 'Delete category',
      onConfirm: () => void removeCategory(cat),
    })
  }

  async function toggleProduct(id: string, available: boolean) {
    await fetch(`/api/menu/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ available: !available }),
    })
    await load()
  }

  async function renameCategory() {
    await load()
  }

  async function removeProduct(id: string) {
    await fetch(`/api/menu/products/${id}`, { method: 'DELETE' })
    if (expandedItemId === id) setExpandedItemId(null)
    await load()
  }

  function requestDeleteProduct(id: string, displayName?: string) {
    const label =
      displayName?.trim() ||
      categories.flatMap((c) => c.items).find((i) => i.id === id)?.name ||
      'this item'
    openConfirm({
      title: 'Delete item',
      message: `Delete “${label}”? This can’t be undone.`,
      confirmLabel: 'Delete item',
      onConfirm: () => void removeProduct(id),
    })
  }

  async function moveCategory(catId: string, direction: 'up' | 'down') {
    const idx = categories.findIndex((c) => c.id === catId)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= categories.length) return

    const current = categories[idx]
    const neighbor = categories[swapIdx]

    await Promise.all([
      fetch(`/api/menu/categories/${current.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: neighbor.sort_order }),
      }),
      fetch(`/api/menu/categories/${neighbor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: current.sort_order }),
      }),
    ])
    await load()
  }

  function startDraftItem(categoryId: string) {
    setExpandedItemId(null)
    setDraftCategoryId(categoryId)
    setSelectedCategoryId(categoryId)
    setCollapsedCategoryIds((prev) => {
      if (!prev.has(categoryId)) return prev
      const next = new Set(prev)
      next.delete(categoryId)
      return next
    })
  }

  function cancelDraft() {
    setDraftCategoryId(null)
  }

  async function duplicateItem(item: MenuBuilderItem, categoryId: string) {
    const res = await fetch('/api/menu/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category_id: categoryId,
        name: `${item.name} (copy)`,
        description: item.description,
        price: (item.base_price / 100).toFixed(2),
        available: item.available,
        featured: item.featured,
        is_bundle: item.is_bundle,
        is_vegan: item.is_vegan,
        is_vegetarian: item.is_vegetarian,
        is_gluten_free: item.is_gluten_free,
        allergens: item.allergens,
        image_url: item.image_url,
        option_groups: (item.option_groups ?? []).map((g) => ({
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
        })),
      }),
    })
    if (!res.ok) return
    const data = await res.json()
    await load()
    if (data.product?.id) setExpandedItemId(data.product.id)
  }

  function filterItemsBySearch(items: MenuBuilderItem[]) {
    if (!query) return items
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        (item.description?.toLowerCase().includes(query) ?? false)
    )
  }

  async function reorderItemByDrop(categoryId: string, draggedId: string, targetId: string) {
    if (draggedId === targetId) return
    const cat = categories.find((c) => c.id === categoryId)
    if (!cat) return
    const items = [...cat.items]
    const fromIdx = items.findIndex((i) => i.id === draggedId)
    const toIdx = items.findIndex((i) => i.id === targetId)
    if (fromIdx < 0 || toIdx < 0) return

    const reordered = [...items]
    const [removed] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, removed)

    await Promise.all(
      reordered.map((item, i) =>
        fetch(`/api/menu/products/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: i }),
        })
      )
    )
    await load()
  }

  function isCategoryEditing(cat: Category) {
    if (draftCategoryId === cat.id) return true
    return cat.items.some((i) => i.id === expandedItemId)
  }

  function renderItemList(categoryId: string, items: MenuBuilderItem[]) {
    return items.map((item) => (
      <MenuItemCard
        key={item.id}
        item={item}
        categoryId={categoryId}
        allCategories={categoryOptions}
        expanded={expandedItemId === item.id}
        onExpand={() => {
          setDraftCategoryId(null)
          setExpandedItemId(item.id)
          setCollapsedCategoryIds((prev) => {
            if (!prev.has(categoryId)) return prev
            const next = new Set(prev)
            next.delete(categoryId)
            return next
          })
        }}
        onDone={() => {
          setExpandedItemId(null)
          load()
        }}
        onUpdated={load}
        onToggleAvailable={() => toggleProduct(item.id, item.available)}
        onDelete={(displayName) => requestDeleteProduct(item.id, displayName)}
        onDuplicate={() => duplicateItem(item, categoryId)}
        onReorder={(draggedId, targetId) => reorderItemByDrop(categoryId, draggedId, targetId)}
        onTagsPoolChanged={load}
        showMenuImages={showMenuImages}
      />
    ))
  }

  function renderDraftEditor(categoryId: string) {
    if (draftCategoryId !== categoryId) return null
    return (
      <div ref={draftEditorRef} className="menu-builder-item-row menu-builder-item-row--expanded scroll-mt-4">
        <MenuItemInlineEditor
          isNew
          item={EMPTY_DRAFT_ITEM}
          categoryId={categoryId}
          allCategories={categoryOptions}
          onDone={cancelDraft}
          onCancel={cancelDraft}
          onDelete={cancelDraft}
          onUpdated={async () => {
            await load()
            cancelDraft()
          }}
          onTagsPoolChanged={load}
          showMenuImages={showMenuImages}
        />
      </div>
    )
  }

  function isCategoryCollapsed(categoryId: string) {
    return collapsedCategoryIds.has(categoryId)
  }

  function toggleCategoryCollapsed(categoryId: string) {
    setCollapsedCategoryIds((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }

  function renderAddItemFooter(cat: Category) {
    return (
      <button
        type="button"
        onClick={() => openNewItemForCategory(cat.id)}
        disabled={draftCategoryId === cat.id}
        className="menu-builder-add-item-btn mt-3 w-full disabled:opacity-50"
      >
        + Add item to {cat.name}
      </button>
    )
  }

  function renderCategoryHeader(
    cat: Category,
    itemCount: number,
    highlighted = false,
    options?: { showCollapse?: boolean }
  ) {
    const index = categories.findIndex((c) => c.id === cat.id)
    const canMoveUp = index > 0
    const canMoveDown = index >= 0 && index < categories.length - 1
    const draftOpen = draftCategoryId === cat.id
    const collapsed = isCategoryCollapsed(cat.id)
    const showCollapse = options?.showCollapse ?? true

    return (
      <div
        className="menu-builder-category-header"
        data-highlighted={highlighted}
        data-collapsed={collapsed}
      >
        {showCollapse && (
          <button
            type="button"
            className="menu-builder-category-collapse-btn"
            onClick={() => toggleCategoryCollapsed(cat.id)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? `Expand ${cat.name}` : `Collapse ${cat.name}`}
            title={collapsed ? 'Expand category' : 'Collapse category'}
          >
            {collapsed ? '▸' : '▾'}
          </button>
        )}
        <span
          className="w-3 h-3 rounded-full shrink-0"
          style={{ background: cat.color }}
        />
        <CategoryTitle categoryId={cat.id} name={cat.name} onRenamed={renameCategory} />
        <span className="text-xs shrink-0" style={{ color: 'var(--mb-muted)' }}>
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </span>
        <CategoryOrderButtons
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onMoveUp={() => moveCategory(cat.id, 'up')}
          onMoveDown={() => moveCategory(cat.id, 'down')}
        />
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
          style={{
            background: cat.is_active ? '#ecfdf5' : '#fef2f2',
            color: cat.is_active ? '#16a34a' : '#dc2626',
          }}
        >
          {cat.is_active ? 'Live' : 'Hidden'}
        </span>
        <div className="flex items-center gap-3 ml-auto shrink-0">
          <button
            type="button"
            onClick={() => openNewItemForCategory(cat.id)}
            disabled={draftOpen}
            className="menu-builder-category-add-btn"
          >
            + Item
          </button>
          <button
            type="button"
            onClick={() => toggleCategoryActive(cat)}
            className="text-xs font-medium"
            style={{ color: 'var(--mb-muted)' }}
          >
            {cat.is_active ? 'Hide category' : 'Show category'}
          </button>
          <button
            type="button"
            onClick={() => deleteCategory(cat)}
            className="menu-builder-category-delete-btn"
            aria-label={`Delete ${cat.name}`}
            title="Delete category"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  function openNewItemForCategory(categoryId: string) {
    startDraftItem(categoryId)
  }

  if (loading) {
    return (
      <div data-menu-builder className="menu-builder items-center justify-center p-8">
        <p style={{ color: 'var(--mb-muted)' }}>Loading menu…</p>
      </div>
    )
  }

  const panelItemCount = selectedCategory?.items.length ?? 0

  return (
    <div data-menu-builder className="menu-builder" data-show-images={showMenuImages ? 'true' : 'false'}>
      <header
        className="flex flex-wrap items-center gap-4 px-5 py-3 border-b shrink-0"
        style={{ borderColor: 'var(--mb-border)', background: 'var(--mb-card)' }}
      >
        <div>
          <h1 className="text-lg font-semibold" style={{ fontFamily: 'var(--mb-heading)' }}>
            {restaurantName}
          </h1>
          <p className="text-xs" style={{ color: 'var(--mb-muted)' }}>
            {categories.length} categories · {itemCount} items
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
          <div className="menu-builder-header-toggles">
            <MenuBuilderHeaderToggle
              label="Menu images"
              checked={showMenuImages}
              disabled={settingsSaving}
              onChange={(checked) => {
                setShowMenuImages(checked)
                void saveRestaurantSetting({ show_menu_images: checked })
              }}
            />
            <MenuBuilderHeaderToggle
              label="Collection"
              checked={collectionEnabled}
              disabled={settingsSaving}
              onChange={(checked) => {
                if (!checked && !deliveryEnabled) return
                setCollectionEnabled(checked)
                void saveRestaurantSetting({ collection_enabled: checked })
              }}
            />
            <MenuBuilderHeaderToggle
              label="Delivery"
              checked={deliveryEnabled}
              disabled={settingsSaving}
              onChange={(checked) => {
                if (!checked && !collectionEnabled) return
                setDeliveryEnabled(checked)
                void saveRestaurantSetting({ delivery_enabled: checked })
              }}
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className={`menu-builder-segment ${mode === 'edit' ? 'menu-builder-segment--active' : 'menu-builder-segment--muted'}`}
              onClick={() => setMode('edit')}
            >
              Edit menu
            </button>
            <button
              type="button"
              className={`menu-builder-segment ${mode === 'preview' ? 'menu-builder-segment--active' : 'menu-builder-segment--muted'}`}
              onClick={enterPreview}
            >
              Preview
            </button>
          </div>
          {mode === 'preview' && (
            <div className="menu-builder-device-toggle" role="group" aria-label="Preview device">
              <button
                type="button"
                className="menu-builder-device-btn"
                data-active={previewDevice === 'mobile'}
                onClick={() => setPreviewDevice('mobile')}
                aria-label="Mobile preview"
                title="Mobile"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="7" y="2" width="10" height="20" rx="2" />
                  <line x1="12" y1="18" x2="12" y2="18" />
                </svg>
              </button>
              <button
                type="button"
                className="menu-builder-device-btn"
                data-active={previewDevice === 'desktop'}
                onClick={() => setPreviewDevice('desktop')}
                aria-label="Desktop preview"
                title="Desktop"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="12" rx="1" />
                  <line x1="8" y1="20" x2="16" y2="20" />
                  <line x1="12" y1="16" x2="12" y2="20" />
                </svg>
              </button>
            </div>
          )}
          {mode === 'preview' && restaurantSlug && (
            <a
              href={`/${restaurantSlug}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold underline"
              style={{ color: 'var(--mb-accent)' }}
            >
              Open live menu
            </a>
          )}
          {mode === 'edit' && (
            <span className="text-xs ml-2" style={{ color: '#16a34a' }}>
              ✓ All changes saved
            </span>
          )}
        </div>
      </header>

      {mode === 'preview' ? (
        <MenuPreview
          key={previewKey}
          device={previewDevice}
          showMenuImages={showMenuImages}
          collectionEnabled={collectionEnabled}
          deliveryEnabled={deliveryEnabled}
        />
      ) : (
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left — categories */}
        <aside
          className="w-56 shrink-0 border-r overflow-y-auto p-3 hidden md:flex md:flex-col gap-4"
          style={{ borderColor: 'var(--mb-border)', background: 'var(--mb-card)' }}
        >
          <CollapsiblePanel
            title="Categories"
            expanded={categoriesOpen}
            onToggle={() => setCategoriesOpen((v) => !v)}
            headerAction={
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setCategoryModalOpen(true)
                }}
                className="text-xs font-semibold px-1"
                style={{ color: 'var(--mb-accent)' }}
              >
                + New
              </button>
            }
          >
            <ul className="space-y-0.5">
              <li>
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId(ALL_ITEMS_ID)}
                  className="menu-builder-rail-item"
                  data-active={selectedCategoryId === ALL_ITEMS_ID}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: '#a8a29e' }}
                  />
                  <span className="truncate">All items</span>
                  <span className="ml-auto text-xs tabular-nums" style={{ color: 'var(--mb-hint)' }}>
                    {itemCount}
                  </span>
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className="menu-builder-rail-item"
                    data-active={selectedCategoryId === cat.id}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: cat.color }}
                    />
                    <span className="truncate">{cat.name}</span>
                    <span className="ml-auto text-xs tabular-nums" style={{ color: 'var(--mb-hint)' }}>
                      {cat.items.length}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </CollapsiblePanel>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="p-4 border-b shrink-0 space-y-3" style={{ borderColor: 'var(--mb-border)' }}>
            <div className="flex flex-wrap gap-2 md:hidden">
              <select
                className="menu-builder-input flex-1"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
              >
                <option value={ALL_ITEMS_ID}>All items ({itemCount})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.items.length})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(true)}
                className="menu-builder-btn-accent text-sm shrink-0"
              >
                + Category
              </button>
            </div>
            <input
              className="menu-builder-input"
              placeholder="Search items by name or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {selectedCategoryId !== ALL_ITEMS_ID && selectedCategory && (
              <section className="menu-builder-category-section mb-4">
                {renderCategoryHeader(selectedCategory, panelItemCount, isCategoryEditing(selectedCategory))}
                {!isCategoryCollapsed(selectedCategory.id) && (
                  <>
                    <div className="space-y-3">{renderItemList(selectedCategoryId, visibleItems)}</div>
                    {renderDraftEditor(selectedCategory.id)}
                    {renderAddItemFooter(selectedCategory)}
                  </>
                )}
              </section>
            )}

            {selectedCategoryId === ALL_ITEMS_ID ? (
              <div className="space-y-8">
                {groupedCategories.map(({ category: cat, items }) => {
                  const collapsed = isCategoryCollapsed(cat.id)
                  return (
                    <section key={cat.id} className="menu-builder-category-section">
                      {renderCategoryHeader(cat, items.length, isCategoryEditing(cat))}
                      {!collapsed && (
                        <>
                          <div className="space-y-3">{renderItemList(cat.id, items)}</div>
                          {renderDraftEditor(cat.id)}
                          {renderAddItemFooter(cat)}
                        </>
                      )}
                    </section>
                  )
                })}
              </div>
            ) : null}

            {(selectedCategoryId === ALL_ITEMS_ID
              ? groupedCategories.every((g) => g.items.length === 0) && !draftCategoryId
              : selectedCategoryId !== ALL_ITEMS_ID &&
                visibleItems.length === 0 &&
                draftCategoryId !== selectedCategoryId) && (
              <p className="text-sm py-12 text-center" style={{ color: 'var(--mb-muted)' }}>
                {query ? 'No items match your search.' : 'No items yet. Add your first item.'}
              </p>
            )}
          </div>
        </main>

        {/* Right — option sets & tags */}
        <aside
          className="w-60 shrink-0 border-l overflow-y-auto p-3 hidden lg:flex lg:flex-col gap-4"
          style={{ borderColor: 'var(--mb-border)', background: 'var(--mb-bg)' }}
        >
          <CollapsiblePanel
            title="Option sets"
            expanded={optionSetsOpen}
            onToggle={() => setOptionSetsOpen((v) => !v)}
          >
            <p className="text-[11px] mb-3 leading-relaxed" style={{ color: 'var(--mb-hint)' }}>
              Build a choice group once (size, extras…) then drag it onto any item.
            </p>
            <ul className="space-y-2 mb-3">
              {attributeSets.map((set) => (
                <li key={set.id}>
                  <div
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/x-attribute-set-id', set.id)
                      e.dataTransfer.effectAllowed = 'copy'
                    }}
                    className="menu-builder-option-set-card"
                  >
                    <div className="flex items-start gap-2">
                      <DragHandle className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{set.name}</p>
                        <p
                          className="text-[10px] uppercase tracking-wide mt-0.5"
                          style={{ color: 'var(--mb-hint)' }}
                        >
                          {groupTypeBadge(set.group_type)}
                        </p>
                        <p className="text-[11px] truncate mt-1" style={{ color: 'var(--mb-muted)' }}>
                          {set.choices.map((c) => c.name).join(', ') || 'No choices'}
                        </p>
                      </div>
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSet(attributeSetToForm(set))
                            setModalOpen(true)
                          }}
                          className="p-1 rounded hover:bg-stone-100"
                          aria-label="Edit option set"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete "${set.name}"?`)) deleteOptionSetById(set.id)
                          }}
                          className="p-1 rounded hover:bg-red-50"
                          aria-label="Delete option set"
                          style={{ color: '#dc2626' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                setEditingSet(null)
                setModalOpen(true)
              }}
              className="text-sm font-semibold w-full text-left"
              style={{ color: 'var(--mb-accent)' }}
            >
              + New option set
            </button>
          </CollapsiblePanel>

          <TagSidebarPanel
            title="Dietary tags"
            hint="Create once (Vegan, Halal…) then drag onto any item."
            tags={dietaryTags}
            expanded={dietaryTagsOpen}
            onToggle={() => setDietaryTagsOpen((v) => !v)}
            onNew={() => openNewTag('DIETARY')}
            onEdit={openEditTag}
            onDelete={(tag) =>
              openConfirm({
                title: 'Delete tag',
                message: `Delete “${tag.name}”?`,
                confirmLabel: 'Delete tag',
                onConfirm: () => void deleteTagById(tag.id),
              })
            }
          />

          <TagSidebarPanel
            title="Allergen tags"
            hint="Create once (Nuts, Dairy…) then drag onto any item."
            tags={allergenTags}
            expanded={allergenTagsOpen}
            onToggle={() => setAllergenTagsOpen((v) => !v)}
            onNew={() => openNewTag('ALLERGEN')}
            onEdit={openEditTag}
            onDelete={(tag) =>
              openConfirm({
                title: 'Delete tag',
                message: `Delete “${tag.name}”?`,
                confirmLabel: 'Delete tag',
                onConfirm: () => void deleteTagById(tag.id),
              })
            }
          />
        </aside>
      </div>
      )}

      <ConfirmDialog
        open={confirmState !== null}
        title={confirmState?.title ?? 'Are you sure?'}
        message={confirmState?.message ?? ''}
        confirmLabel={confirmState?.confirmLabel ?? 'Delete'}
        onConfirm={() => {
          confirmState?.onConfirm()
          setConfirmState(null)
        }}
        onCancel={() => setConfirmState(null)}
      />

      <CategoryModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSave={createCategory}
      />

      <OptionSetModal
        open={modalOpen}
        initial={editingSet}
        onClose={() => {
          setModalOpen(false)
          setEditingSet(null)
        }}
        onSave={saveOptionSet}
        onDelete={editingSet?.id ? deleteOptionSet : undefined}
      />

      <TagModal
        open={tagModalOpen}
        kind={tagModalKind}
        initial={editingTag}
        onClose={() => {
          setTagModalOpen(false)
          setEditingTag(null)
        }}
        onSave={saveTag}
        onDelete={
          editingTag?.id
            ? async () => {
                await deleteTagById(editingTag.id!)
              }
            : undefined
        }
      />

    </div>
  )
}
