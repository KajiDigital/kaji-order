'use client'

import { useState } from 'react'
import { TAG_COLORS, type MenuTagKind } from '@/app/lib/menu-tags'
import type { MenuTagDto } from './TagSidebarPanel'

type LinkedTag = {
  tag_id: string
  tag: { id: string; kind: string; name: string; color: string }
}

type Props = {
  kind: MenuTagKind
  itemId: string
  isNew: boolean
  linkedTags: LinkedTag[]
  availableTags: MenuTagDto[]
  expanded: boolean
  onToggle: () => void
  onUpdated: () => void
  onPoolChanged: () => void
  toggleOnly?: boolean
  panelOnly?: boolean
}

function kindLabel(kind: MenuTagKind) {
  return kind === 'DIETARY' ? 'dietary tags' : 'allergens'
}

function summaryText(kind: MenuTagKind, linkedTags: LinkedTag[]) {
  if (linkedTags.length === 0) return `Add ${kindLabel(kind)}`
  const prefix = kind === 'DIETARY' ? 'Dietary tags' : 'Allergens'
  return `${prefix}: ${linkedTags.map((l) => l.tag.name).join(', ')}`
}

export function ItemTagPicker({
  kind,
  itemId,
  isNew,
  linkedTags,
  availableTags,
  expanded,
  onToggle,
  onUpdated,
  onPoolChanged,
  toggleOnly = false,
  panelOnly = false,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(TAG_COLORS[0])
  const [adding, setAdding] = useState(false)

  const linkedIds = new Set(linkedTags.map((l) => l.tag_id))
  const tags = availableTags.filter((t) => t.kind === kind)

  async function linkTag(tagId: string) {
    if (isNew || linkedIds.has(tagId)) return
    await fetch(`/api/menu/products/${itemId}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag_id: tagId }),
    })
    onUpdated()
  }

  async function unlinkTag(tagId: string) {
    if (isNew) return
    await fetch(`/api/menu/products/${itemId}/tags/${tagId}`, { method: 'DELETE' })
    onUpdated()
  }

  async function toggleTag(tagId: string) {
    if (linkedIds.has(tagId)) await unlinkTag(tagId)
    else await linkTag(tagId)
  }

  async function addTag() {
    const name = newName.trim()
    if (!name) return
    setAdding(true)
    try {
      const res = await fetch('/api/menu/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          name,
          color: kind === 'DIETARY' ? newColor : TAG_COLORS[10],
        }),
      })
      const data = await res.json()
      if (res.ok && data.tag?.id && !isNew) {
        await linkTag(data.tag.id)
      }
      setNewName('')
      onPoolChanged()
      if (isNew) onPoolChanged()
    } finally {
      setAdding(false)
    }
  }

  async function deleteTagFromPool(tag: MenuTagDto) {
    if (!confirm(`Delete "${tag.name}" from your menu tags?`)) return
    await fetch(`/api/menu/tags/${tag.id}`, { method: 'DELETE' })
    onPoolChanged()
    onUpdated()
  }

  function handleDone() {
    setEditing(false)
  }

  const toggle = (
    <button
      type="button"
      className="menu-builder-tag-section-toggle"
      onClick={onToggle}
      aria-expanded={expanded}
    >
      <span>{summaryText(kind, linkedTags)}</span>
      <span className="menu-builder-tag-section-chevron" aria-hidden>
        {expanded ? '▴' : '▾'}
      </span>
    </button>
  )

  const panel = (
    <div className="menu-builder-tag-section-panel">
      {isNew ? (
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--mb-hint)' }}>
          Save the item first, then assign {kindLabel(kind)} here.
        </p>
      ) : (
        <>
          <div className="menu-builder-tag-section-grid">
            {tags.map((tag) => {
              const linked = linkedIds.has(tag.id)
              const showRemove = editing && linked

              if (editing) {
                return (
                  <button
                    key={tag.id}
                    type="button"
                    className={`menu-builder-tag-option ${linked ? 'menu-builder-tag-option--linked-edit' : ''}`}
                    onClick={() => !linked && linkTag(tag.id)}
                  >
                    {kind === 'DIETARY' && (
                      <span
                        className="menu-builder-tag-option-dot"
                        style={{ background: tag.color }}
                      />
                    )}
                    {tag.name}
                    {showRemove && (
                      <span
                        role="button"
                        tabIndex={0}
                        className="menu-builder-tag-option-remove"
                        aria-label={`Remove ${tag.name}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          unlinkTag(tag.id)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            e.stopPropagation()
                            unlinkTag(tag.id)
                          }
                        }}
                      >
                        ×
                      </span>
                    )}
                    {!linked && (
                      <span
                        role="button"
                        tabIndex={0}
                        className="menu-builder-tag-option-remove menu-builder-tag-option-remove--pool"
                        aria-label={`Delete ${tag.name} tag`}
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteTagFromPool(tag)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            e.stopPropagation()
                            deleteTagFromPool(tag)
                          }
                        }}
                      >
                        ×
                      </span>
                    )}
                  </button>
                )
              }

              return (
                <button
                  key={tag.id}
                  type="button"
                  className={`menu-builder-tag-option ${linked ? 'menu-builder-tag-option--linked' : ''}`}
                  data-kind={kind.toLowerCase()}
                  style={
                    linked && kind === 'DIETARY'
                      ? {
                          background: `${tag.color}18`,
                          borderColor: `${tag.color}55`,
                          color: tag.color,
                        }
                      : undefined
                  }
                  onClick={() => toggleTag(tag.id)}
                >
                  {kind === 'DIETARY' && (
                    <span
                      className="menu-builder-tag-option-dot"
                      style={{ background: tag.color }}
                    />
                  )}
                  {tag.name}
                </button>
              )
            })}
          </div>

          <div className="menu-builder-tag-section-add">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={kind === 'DIETARY' ? 'New tag name…' : 'New allergen…'}
              className="menu-builder-field text-sm flex-1 min-w-0"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag()
                }
              }}
            />
            {kind === 'DIETARY' && (
              <div className="menu-builder-tag-colors">
                {TAG_COLORS.slice(0, 8).map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="menu-builder-tag-color-swatch"
                    data-active={newColor === c}
                    style={{ background: c }}
                    aria-label="Tag colour"
                    onClick={() => setNewColor(c)}
                  />
                ))}
              </div>
            )}
            <button
              type="button"
              className="menu-builder-btn-primary menu-builder-tag-add-btn"
              disabled={adding || !newName.trim()}
              onClick={addTag}
            >
              + Add
            </button>
            {editing ? (
              <button type="button" className="menu-builder-tag-edit-link" onClick={handleDone}>
                Done
              </button>
            ) : (
              <button
                type="button"
                className="menu-builder-tag-edit-link"
                onClick={() => setEditing(true)}
              >
                Edit
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )

  if (toggleOnly) {
    return <div className="menu-builder-tag-section">{toggle}</div>
  }

  if (panelOnly) {
    return <div className="menu-builder-tag-section menu-builder-tag-section--panel">{panel}</div>
  }

  return (
    <div className="menu-builder-tag-section">
      {toggle}
      {expanded && panel}
    </div>
  )
}
