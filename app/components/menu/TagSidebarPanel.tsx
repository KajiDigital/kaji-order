'use client'

import { CollapsiblePanel } from './CollapsiblePanel'
import { DragHandle } from './DragHandle'

export type MenuTagDto = {
  id: string
  kind: 'DIETARY' | 'ALLERGEN'
  name: string
  color: string
  sort_order: number
  linked_item_ids: string[]
}

const MENU_TAG_DRAG_TYPE = 'application/x-menu-tag-id'

type Props = {
  title: string
  hint: string
  tags: MenuTagDto[]
  expanded: boolean
  onToggle: () => void
  onNew: () => void
  onEdit: (tag: MenuTagDto) => void
  onDelete: (tag: MenuTagDto) => void
}

export function TagSidebarPanel({
  title,
  hint,
  tags,
  expanded,
  onToggle,
  onNew,
  onEdit,
  onDelete,
}: Props) {
  return (
    <CollapsiblePanel
      title={title}
      expanded={expanded}
      onToggle={onToggle}
      headerAction={
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onNew()
          }}
          className="text-xs font-semibold px-1"
          style={{ color: 'var(--mb-accent)' }}
        >
          + New
        </button>
      }
    >
      <p className="text-[11px] mb-3 leading-relaxed" style={{ color: 'var(--mb-hint)' }}>
        {hint}
      </p>
      <ul className="space-y-2 mb-3">
        {tags.map((tag) => (
          <li key={tag.id}>
            <div
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(MENU_TAG_DRAG_TYPE, tag.id)
                e.dataTransfer.effectAllowed = 'copy'
              }}
              className="menu-builder-tag-card"
            >
              <div className="flex items-center gap-2 min-w-0">
                <DragHandle />
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: tag.color }}
                />
                <p className="text-sm font-semibold truncate flex-1">{tag.name}</p>
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onEdit(tag)}
                    className="p-1 rounded hover:bg-stone-100"
                    aria-label="Edit tag"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(tag)}
                    className="p-1 rounded hover:bg-red-50"
                    aria-label="Delete tag"
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
        {tags.length === 0 && (
          <p className="text-xs py-2 text-center" style={{ color: 'var(--mb-muted)' }}>
            No tags yet
          </p>
        )}
      </ul>
    </CollapsiblePanel>
  )
}

export { MENU_TAG_DRAG_TYPE }
