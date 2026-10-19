'use client'

import { useState } from 'react'
import type { MenuTagKind } from '@/app/lib/menu-tags'
import type { MenuTagDto } from './TagSidebarPanel'
import { ItemTagPicker } from './ItemTagPicker'

type LinkedTag = {
  tag_id: string
  tag: { id: string; kind: string; name: string; color: string }
}

type Props = {
  itemId: string
  isNew: boolean
  dietaryTags: LinkedTag[]
  allergenTags: LinkedTag[]
  availableTags: MenuTagDto[]
  onUpdated: () => void
  onPoolChanged: () => void
}

export function ItemTagSections({
  itemId,
  isNew,
  dietaryTags,
  allergenTags,
  availableTags,
  onUpdated,
  onPoolChanged,
}: Props) {
  const [expanded, setExpanded] = useState<MenuTagKind | null>(null)

  function toggleSection(kind: MenuTagKind) {
    setExpanded((current) => (current === kind ? null : kind))
  }

  return (
    <div className="menu-builder-tag-sections">
      <div className="menu-builder-tag-section-toggles">
        <ItemTagPicker
          kind="DIETARY"
          itemId={itemId}
          isNew={isNew}
          linkedTags={dietaryTags}
          availableTags={availableTags}
          expanded={expanded === 'DIETARY'}
          onToggle={() => toggleSection('DIETARY')}
          onUpdated={onUpdated}
          onPoolChanged={onPoolChanged}
          toggleOnly
        />
        <ItemTagPicker
          kind="ALLERGEN"
          itemId={itemId}
          isNew={isNew}
          linkedTags={allergenTags}
          availableTags={availableTags}
          expanded={expanded === 'ALLERGEN'}
          onToggle={() => toggleSection('ALLERGEN')}
          onUpdated={onUpdated}
          onPoolChanged={onPoolChanged}
          toggleOnly
        />
      </div>

      {expanded === 'DIETARY' && (
        <ItemTagPicker
          kind="DIETARY"
          itemId={itemId}
          isNew={isNew}
          linkedTags={dietaryTags}
          availableTags={availableTags}
          expanded
          onToggle={() => toggleSection('DIETARY')}
          onUpdated={onUpdated}
          onPoolChanged={onPoolChanged}
          panelOnly
        />
      )}

      {expanded === 'ALLERGEN' && (
        <ItemTagPicker
          kind="ALLERGEN"
          itemId={itemId}
          isNew={isNew}
          linkedTags={allergenTags}
          availableTags={availableTags}
          expanded
          onToggle={() => toggleSection('ALLERGEN')}
          onUpdated={onUpdated}
          onPoolChanged={onPoolChanged}
          panelOnly
        />
      )}
    </div>
  )
}
