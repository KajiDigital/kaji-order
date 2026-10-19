'use client'

import { useEffect, useRef, useState } from 'react'
import { DragHandle } from './DragHandle'
import { MenuItemInlineEditor } from './MenuItemInlineEditor'

export type MenuItemLink = {
  attribute_set_id: string
  sort_order: number
  attribute_set: {
    id: string
    name: string
    group_type: string
    choices?: { id: string; name: string; price_delta: number }[]
  }
}

export type MenuItemTagLink = {
  tag_id: string
  sort_order: number
  tag: {
    id: string
    kind: string
    name: string
    color: string
  }
}

export type MenuBuilderItem = {
  id: string
  name: string
  description: string | null
  base_price: number
  image_url: string | null
  available: boolean
  is_bundle: boolean
  featured: boolean
  spice_level?: number | null
  is_vegan?: boolean
  is_vegetarian?: boolean
  is_gluten_free?: boolean
  allergens?: unknown
  attribute_set_links?: MenuItemLink[]
  tag_links?: MenuItemTagLink[]
  option_groups?: {
    id: string
    name: string
    group_type: string
    required: boolean
    min_selections: number
    max_selections: number
    options: { name: string; price_delta: number; is_default?: boolean }[]
  }[]
  combo_groups?: { id: string; name: string }[]
  combo_groups_detail?: {
    id: string
    name: string
    required: boolean
    min_items: number
    max_items: number
    source_type: string
    source_category_id?: string | null
    combo_options: {
      menu_item_id: string
      menu_item?: { id: string; name: string; base_price: number }
    }[]
  }[]
}

export const EMPTY_DRAFT_ITEM: MenuBuilderItem = {
  id: '__draft__',
  name: '',
  description: null,
  base_price: 0,
  image_url: null,
  available: true,
  is_bundle: false,
  featured: false,
  option_groups: [],
  combo_groups: [],
  combo_groups_detail: [],
}

type Category = {
  id: string
  name: string
  items: { id: string; name: string; base_price?: number }[]
}

type Props = {
  item: MenuBuilderItem
  categoryId: string
  allCategories: Category[]
  expanded: boolean
  onExpand: () => void
  onDone: () => void
  onUpdated: () => void
  onToggleAvailable: () => void
  onDelete: (displayName?: string) => void
  onDuplicate: () => void
  onReorder?: (draggedId: string, targetId: string) => void
  onTagsPoolChanged?: () => void
  showMenuImages?: boolean
}

const MENU_ITEM_DRAG_TYPE = 'application/x-menu-item-id'
const ATTRIBUTE_SET_DRAG_TYPE = 'application/x-attribute-set-id'
const MENU_TAG_DRAG_TYPE = 'application/x-menu-tag-id'

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: (e: React.MouseEvent) => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="p-1.5 rounded-md transition-colors hover:bg-stone-100"
      style={{ color: 'var(--mb-muted)' }}
    >
      {children}
    </button>
  )
}

function configLine(item: MenuBuilderItem): string | null {
  if (item.combo_groups?.length) {
    return item.combo_groups.map((g) => g.name).join(' + ')
  }
  if (item.attribute_set_links?.length) {
    return item.attribute_set_links.map((l) => l.attribute_set.name).join(' · ')
  }
  if (item.option_groups?.length) {
    return item.option_groups.map((g) => g.name).join(' · ')
  }
  return null
}

export function MenuItemCard({
  item,
  categoryId,
  allCategories,
  expanded,
  onExpand,
  onDone,
  onUpdated,
  onToggleAvailable,
  onDelete,
  onDuplicate,
  onReorder,
  onTagsPoolChanged,
  showMenuImages = true,
}: Props) {
  const [dropActive, setDropActive] = useState(false)
  const [reorderOver, setReorderOver] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const config = configLine(item)

  useEffect(() => {
    if (!expanded) return
    const timer = window.setTimeout(() => {
      editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
    return () => window.clearTimeout(timer)
  }, [expanded])

  function handleDragOver(e: React.DragEvent) {
    const isItemReorder = e.dataTransfer.types.includes(MENU_ITEM_DRAG_TYPE)
    const isAttributeSet = e.dataTransfer.types.includes(ATTRIBUTE_SET_DRAG_TYPE)
    const isMenuTag = e.dataTransfer.types.includes(MENU_TAG_DRAG_TYPE)
    if (!isItemReorder && !isAttributeSet && !isMenuTag) return
    e.preventDefault()
    e.dataTransfer.dropEffect = isItemReorder ? 'move' : 'copy'
    setDropActive(isAttributeSet || isMenuTag)
    setReorderOver(isItemReorder)
  }

  function handleDragLeave() {
    setDropActive(false)
    setReorderOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDropActive(false)
    setReorderOver(false)
    const setId = e.dataTransfer.getData(ATTRIBUTE_SET_DRAG_TYPE)
    const draggedId = e.dataTransfer.getData(MENU_ITEM_DRAG_TYPE)
    const tagId = e.dataTransfer.getData(MENU_TAG_DRAG_TYPE)
    if (setId) handleDropAttributeSet(setId)
    else if (tagId) handleDropTag(tagId)
    else if (draggedId && draggedId !== item.id) onReorder?.(draggedId, item.id)
  }

  async function handleDropTag(tagId: string) {
    await fetch(`/api/menu/products/${item.id}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag_id: tagId }),
    })
    onUpdated()
  }

  async function handleDropAttributeSet(attributeSetId: string) {
    await fetch(`/api/menu/products/${item.id}/attribute-sets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attribute_set_id: attributeSetId }),
    })
    onUpdated()
  }

  function stop(e: React.MouseEvent) {
    e.stopPropagation()
  }

  if (expanded) {
    return (
      <div
        ref={editorRef}
        className={`menu-builder-item-row menu-builder-item-row--expanded scroll-mt-4 ${dropActive ? 'menu-builder-drop-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <MenuItemInlineEditor
          item={item}
          categoryId={categoryId}
          allCategories={allCategories}
          showMenuImages={showMenuImages}
          onDone={onDone}
          onCancel={onDone}
          onDelete={onDelete}
          onUpdated={onUpdated}
          onTagsPoolChanged={onTagsPoolChanged}
        />
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={`menu-builder-item-row cursor-pointer ${showMenuImages ? '' : 'menu-builder-item-row--text-only'} ${dropActive ? 'menu-builder-drop-active' : ''} ${reorderOver ? 'menu-builder-item-row--reorder-over' : ''}`}
      onClick={onExpand}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onExpand()
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <DragHandle
        draggable
        className="self-center"
        onDragStart={(e) => {
          e.stopPropagation()
          e.dataTransfer.setData(MENU_ITEM_DRAG_TYPE, item.id)
          e.dataTransfer.effectAllowed = 'move'
        }}
        onClick={stop}
      />

      {showMenuImages && (
        <div className="menu-builder-item-thumb shrink-0">
          {item.image_url ? (
            <img src={item.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--mb-hint)' }}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col gap-1 pr-2">
        <p className="font-bold text-[15px] leading-snug" style={{ fontFamily: 'var(--mb-heading)' }}>
          {item.name}
        </p>

        <div className="flex flex-wrap gap-1">
          {item.is_bundle && (
            <span className="menu-builder-badge menu-builder-badge--set">Set meal</span>
          )}
          {item.featured && (
            <span className="menu-builder-badge menu-builder-badge--featured">★ Featured</span>
          )}
          {item.tag_links?.map((link) => (
            <span
              key={link.tag_id}
              className="menu-builder-badge"
              style={{
                background: `${link.tag.color}18`,
                color: link.tag.color,
                border: `1px solid ${link.tag.color}44`,
              }}
            >
              {link.tag.name}
            </span>
          ))}
          {!item.available && (
            <span className="menu-builder-badge menu-builder-badge--hidden">Hidden</span>
          )}
        </div>

        {item.description ? (
          <p className="text-sm whitespace-normal break-words leading-relaxed" style={{ color: 'var(--mb-muted)' }}>
            {item.description}
          </p>
        ) : null}

        {config && (
          <p className="text-xs whitespace-normal break-words" style={{ color: 'var(--mb-hint)' }}>
            {config}
          </p>
        )}

        <p className="text-base font-bold mt-0.5" style={{ color: 'var(--mb-accent)' }}>
          £{(item.base_price / 100).toFixed(2)}
        </p>
      </div>

      <div className="flex flex-col items-center justify-between shrink-0 self-stretch py-0.5" onClick={stop}>
        <div className="flex flex-col">
          <IconButton
            label={item.available ? 'Hide item' : 'Show item'}
            onClick={(e) => {
              stop(e)
              onToggleAvailable()
            }}
          >
            {item.available ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            )}
          </IconButton>
          <IconButton
            label="Duplicate item"
            onClick={(e) => {
              stop(e)
              onDuplicate()
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          </IconButton>
          <IconButton
            label="Delete item"
            onClick={(e) => {
              stop(e)
              onDelete(item.name)
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </IconButton>
        </div>
      </div>
    </div>
  )
}
