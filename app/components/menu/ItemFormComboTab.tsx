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
      <p className="text-sm text-slate-400">
        Bundle price is set on the Basic tab. Add courses customers pick from (starter, main, etc.).
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
        className="text-xs text-violet-400"
      >
        + Add course / group
      </button>
      {groups.map((g, gi) => (
        <div key={gi} className="bg-slate-800 rounded-lg p-4 space-y-3 border border-slate-700">
          <input
            value={g.name}
            onChange={(e) => updateGroup(gi, { ...g, name: e.target.value })}
            placeholder="Course name"
            className="w-full bg-slate-700 rounded px-2 py-1.5 text-white text-sm"
          />
          <div className="flex gap-4 text-sm text-slate-300">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={g.required}
                onChange={(e) => updateGroup(gi, { ...g, required: e.target.checked })}
              />
              Required
            </label>
            <label className="text-slate-400">
              Min
              <input
                type="number"
                min={0}
                value={g.min_items}
                onChange={(e) => updateGroup(gi, { ...g, min_items: Number(e.target.value) })}
                className="w-16 ml-1 bg-slate-700 rounded px-2 py-1 text-white"
              />
            </label>
            <label className="text-slate-400">
              Max
              <input
                type="number"
                min={1}
                value={g.max_items}
                onChange={(e) => updateGroup(gi, { ...g, max_items: Number(e.target.value) })}
                className="w-16 ml-1 bg-slate-700 rounded px-2 py-1 text-white"
              />
            </label>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-slate-400">Choose items from:</p>
            {(['ITEMS', 'CATEGORY', 'ANY'] as const).map((st) => (
              <label key={st} className="flex items-center gap-2 text-slate-300">
                <input
                  type="radio"
                  name={`source-${gi}`}
                  checked={g.source_type === st}
                  onChange={() => updateGroup(gi, { ...g, source_type: st, combo_options: st === 'ITEMS' ? g.combo_options : [] })}
                />
                {st === 'ITEMS' && 'Specific items (select below)'}
                {st === 'CATEGORY' && 'Specific category'}
                {st === 'ANY' && 'Any item on menu'}
              </label>
            ))}
          </div>
          {g.source_type === 'CATEGORY' && (
            <select
              value={g.source_category_id}
              onChange={(e) => updateGroup(gi, { ...g, source_category_id: e.target.value })}
              className="w-full bg-slate-700 rounded px-2 py-1 text-white text-sm"
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
            <div className="max-h-48 overflow-y-auto space-y-1 border border-slate-700 rounded p-2">
              {allItems.map((item) => {
                const checked = g.combo_options.some((o) => o.menu_item_id === item.id)
                return (
                  <label key={item.id} className="flex items-center gap-2 text-xs text-slate-300">
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
                    <span className="text-slate-500">({item.categoryName})</span>
                  </label>
                )
              })}
            </div>
          )}
          <button type="button" onClick={() => onChange(groups.filter((_, i) => i !== gi))} className="text-xs text-red-400">
            Remove course
          </button>
        </div>
      ))}
      {groups.length === 0 && <p className="text-sm text-slate-500">Add at least one course for bundle items.</p>}
    </div>
  )
}
