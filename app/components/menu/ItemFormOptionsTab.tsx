'use client'

export type OptionForm = {
  name: string
  price: string
  is_default?: boolean
}

export type OptionGroupForm = {
  name: string
  group_type: string
  required: boolean
  min_selections: number
  max_selections: number
  options: OptionForm[]
}

type Props = {
  groups: OptionGroupForm[]
  onChange: (groups: OptionGroupForm[]) => void
}

export function ItemFormOptionsTab({ groups, onChange }: Props) {
  function updateGroup(index: number, next: OptionGroupForm) {
    const copy = [...groups]
    copy[index] = next
    onChange(copy)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2">
        <p className="text-sm" style={{ color: 'var(--mb-muted)' }}>
          Item-specific option groups. For shared sets (Size, Extras), use the Option sets sidebar.
        </p>
        <button
          type="button"
          onClick={() =>
            onChange([
              ...groups,
              { name: 'Choose option', group_type: 'SINGLE', required: true, min_selections: 1, max_selections: 1, options: [] },
            ])
          }
          className="menu-builder-link shrink-0"
        >
          + Add group
        </button>
      </div>
      {groups.map((g, gi) => (
        <div key={gi} className="menu-builder-panel space-y-3">
          <input
            value={g.name}
            onChange={(e) => updateGroup(gi, { ...g, name: e.target.value })}
            placeholder="Group name"
            className="menu-builder-input"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="menu-builder-label">Type</label>
              <select
                value={g.group_type}
                onChange={(e) => updateGroup(gi, { ...g, group_type: e.target.value })}
                className="menu-builder-input"
              >
                <option value="SINGLE">Single choice</option>
                <option value="MULTIPLE">Multiple</option>
                <option value="OPTIONAL">Optional extras</option>
              </select>
            </div>
            <label className="menu-builder-check-label self-end pb-2">
              <input
                type="checkbox"
                checked={g.required}
                onChange={(e) => updateGroup(gi, { ...g, required: e.target.checked })}
              />
              Required
            </label>
            <div>
              <label className="menu-builder-label">Min</label>
              <input
                type="number"
                min={0}
                value={g.min_selections}
                onChange={(e) => updateGroup(gi, { ...g, min_selections: Number(e.target.value) })}
                className="menu-builder-input"
              />
            </div>
            <div>
              <label className="menu-builder-label">Max</label>
              <input
                type="number"
                min={1}
                value={g.max_selections}
                onChange={(e) => updateGroup(gi, { ...g, max_selections: Number(e.target.value) })}
                className="menu-builder-input"
              />
            </div>
          </div>
          <div className="space-y-2">
            <p className="menu-builder-label mb-0">Choices</p>
            {g.options.map((o, oi) => (
              <div key={oi} className="flex gap-2 items-center">
                <input
                  value={o.name}
                  onChange={(e) => {
                    const opts = [...g.options]
                    opts[oi] = { ...o, name: e.target.value }
                    updateGroup(gi, { ...g, options: opts })
                  }}
                  className="menu-builder-input flex-1"
                  placeholder="Choice name"
                />
                <input
                  value={o.price}
                  onChange={(e) => {
                    const opts = [...g.options]
                    opts[oi] = { ...o, price: e.target.value }
                    updateGroup(gi, { ...g, options: opts })
                  }}
                  className="menu-builder-input w-24"
                  placeholder="+£0"
                />
                <label className="menu-builder-check-label text-xs shrink-0">
                  <input
                    type="checkbox"
                    checked={o.is_default ?? false}
                    onChange={(e) => {
                      const opts = [...g.options]
                      opts[oi] = { ...o, is_default: e.target.checked }
                      updateGroup(gi, { ...g, options: opts })
                    }}
                  />
                  Default
                </label>
              </div>
            ))}
            <button
              type="button"
              onClick={() => updateGroup(gi, { ...g, options: [...g.options, { name: '', price: '0' }] })}
              className="menu-builder-link text-sm"
            >
              + Add choice
            </button>
          </div>
          <button
            type="button"
            onClick={() => onChange(groups.filter((_, i) => i !== gi))}
            className="text-sm font-medium"
            style={{ color: '#dc2626' }}
          >
            Delete group
          </button>
        </div>
      ))}
      {groups.length === 0 && (
        <p className="text-sm py-4 text-center" style={{ color: 'var(--mb-muted)' }}>
          No item-specific groups. Drag option sets from the right sidebar onto the item card.
        </p>
      )}
    </div>
  )
}
