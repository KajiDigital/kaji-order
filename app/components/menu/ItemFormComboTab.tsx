'use client'

export type ComboGroupForm = {
  name: string
  required: boolean
  min_items: number
  max_items: number
  source_type: string
  source_category_id: string
  combo_options: { menu_item_id: string; name: string }[]
}

type MenuCategory = {
  id: string
  name: string
  items: { id: string; name: string }[]
}

type Props = {
  groups: ComboGroupForm[]
  categories: MenuCategory[]
  onChange: (groups: ComboGroupForm[]) => void
}

export function ItemFormComboTab({ groups, categories, onChange }: Props) {
  function updateGroup(index: number, next: ComboGroupForm) {
    const copy = [...groups]
    copy[index] = next
    onChange(copy)
  }

  const allItems = categories.flatMap((c) => c.items.map((i) => ({ ...i, categoryName: c.name })))

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--mb-muted)' }}>
        Set meal price is on the Basic tab. Add courses customers pick from (starter, main, etc.).
      </p>
      <button
        type="button"
        onClick={() =>
          onChange([
            ...groups,
            {
              name: 'Select course',
              required: true,
              min_items: 1,
              max_items: 1,
              source_type: 'ITEMS',
              source_category_id: '',
              combo_options: [],
            },
          ])
        }
        className="menu-builder-link"
      >
        + Add course
      </button>
      {groups.map((g, gi) => (
        <div key={gi} className="menu-builder-panel space-y-3">
          <input
            value={g.name}
            onChange={(e) => updateGroup(gi, { ...g, name: e.target.value })}
            placeholder="Course name"
            className="menu-builder-input"
          />
          <div className="flex flex-wrap gap-4">
            <label className="menu-builder-check-label">
              <input
                type="checkbox"
                checked={g.required}
                onChange={(e) => updateGroup(gi, { ...g, required: e.target.checked })}
              />
              Required
            </label>
            <label className="menu-builder-check-label">
              Min
              <input
                type="number"
                min={0}
                value={g.min_items}
                onChange={(e) => updateGroup(gi, { ...g, min_items: Number(e.target.value) })}
                className="menu-builder-input w-16 ml-1 inline-block"
              />
            </label>
            <label className="menu-builder-check-label">
              Max
              <input
                type="number"
                min={1}
                value={g.max_items}
                onChange={(e) => updateGroup(gi, { ...g, max_items: Number(e.target.value) })}
                className="menu-builder-input w-16 ml-1 inline-block"
              />
            </label>
          </div>
          <div className="space-y-2">
            <p className="menu-builder-label mb-0">Customers choose from</p>
            {(['ITEMS', 'CATEGORY', 'ANY'] as const).map((st) => (
              <label key={st} className="menu-builder-check-label">
                <input
                  type="radio"
                  name={`source-${gi}`}
                  checked={g.source_type === st}
                  onChange={() =>
                    updateGroup(gi, {
                      ...g,
                      source_type: st,
                      combo_options: st === 'ITEMS' ? g.combo_options : [],
                    })
                  }
                />
                {st === 'ITEMS' && 'Specific items'}
                {st === 'CATEGORY' && 'Whole category'}
                {st === 'ANY' && 'Any menu item'}
              </label>
            ))}
          </div>
          {g.source_type === 'CATEGORY' && (
            <select
              value={g.source_category_id}
              onChange={(e) => updateGroup(gi, { ...g, source_category_id: e.target.value })}
              className="menu-builder-input"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          {g.source_type === 'ITEMS' && (
            <div
              className="max-h-48 overflow-y-auto space-y-1 rounded-lg p-3 border"
              style={{ borderColor: 'var(--mb-border)', background: 'var(--mb-card)' }}
            >
              {allItems.map((item) => {
                const checked = g.combo_options.some((o) => o.menu_item_id === item.id)
                return (
                  <label key={item.id} className="menu-builder-check-label text-xs">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const next = checked
                          ? g.combo_options.filter((o) => o.menu_item_id !== item.id)
                          : [...g.combo_options, { menu_item_id: item.id, name: item.name }]
                        updateGroup(gi, { ...g, combo_options: next })
                      }}
                    />
                    {item.name}
                    <span style={{ color: 'var(--mb-hint)' }}>({item.categoryName})</span>
                  </label>
                )
              })}
            </div>
          )}
          <button
            type="button"
            onClick={() => onChange(groups.filter((_, i) => i !== gi))}
            className="text-sm font-medium"
            style={{ color: '#dc2626' }}
          >
            Remove course
          </button>
        </div>
      ))}
      {groups.length === 0 && (
        <p className="text-sm py-4 text-center" style={{ color: 'var(--mb-muted)' }}>
          Add at least one course for set meals.
        </p>
      )}
    </div>
  )
}
