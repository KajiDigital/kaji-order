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
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-400">Option groups for size, filling, extras, etc.</p>
        <button
          type="button"
          onClick={() =>
            onChange([
              ...groups,
              { name: 'Choose option', group_type: 'SINGLE', required: true, min_selections: 1, max_selections: 1, options: [] },
            ])
          }
          className="text-xs text-violet-400"
        >
          + Add option group
        </button>
      </div>
      {groups.map((g, gi) => (
        <div key={gi} className="bg-slate-800 rounded-lg p-4 space-y-3 border border-slate-700">
          <input
            value={g.name}
            onChange={(e) => updateGroup(gi, { ...g, name: e.target.value })}
            placeholder="Group name"
            className="w-full bg-slate-700 rounded px-2 py-1.5 text-white text-sm"
          />
          <div className="grid grid-cols-2 gap-2 text-sm">
            <label className="text-slate-400">
              Type
              <select
                value={g.group_type}
                onChange={(e) => updateGroup(gi, { ...g, group_type: e.target.value })}
                className="w-full mt-1 bg-slate-700 rounded px-2 py-1 text-white text-sm"
              >
                <option value="SINGLE">Single</option>
                <option value="MULTIPLE">Multiple</option>
                <option value="OPTIONAL">Optional</option>
              </select>
            </label>
            <label className="flex items-end gap-2 text-slate-300 pb-1">
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
                value={g.min_selections}
                onChange={(e) => updateGroup(gi, { ...g, min_selections: Number(e.target.value) })}
                className="w-full mt-1 bg-slate-700 rounded px-2 py-1 text-white text-sm"
              />
            </label>
            <label className="text-slate-400">
              Max
              <input
                type="number"
                min={1}
                value={g.max_selections}
                onChange={(e) => updateGroup(gi, { ...g, max_selections: Number(e.target.value) })}
                className="w-full mt-1 bg-slate-700 rounded px-2 py-1 text-white text-sm"
              />
            </label>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-slate-500">Options</p>
            {g.options.map((o, oi) => (
              <div key={oi} className="flex gap-2 items-center">
                <input
                  value={o.name}
                  onChange={(e) => {
                    const opts = [...g.options]
                    opts[oi] = { ...o, name: e.target.value }
                    updateGroup(gi, { ...g, options: opts })
                  }}
                  className="flex-1 bg-slate-700 rounded px-2 py-1 text-white text-sm"
                  placeholder="Option name"
                />
                <input
                  value={o.price}
                  onChange={(e) => {
                    const opts = [...g.options]
                    opts[oi] = { ...o, price: e.target.value }
                    updateGroup(gi, { ...g, options: opts })
                  }}
                  className="w-20 bg-slate-700 rounded px-2 py-1 text-white text-sm"
                  placeholder="+£0"
                />
                <label className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
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
              className="text-xs text-violet-400"
            >
              + Add option
            </button>
          </div>
          <button type="button" onClick={() => onChange(groups.filter((_, i) => i !== gi))} className="text-xs text-red-400">
            Delete group
          </button>
        </div>
      ))}
      {groups.length === 0 && <p className="text-sm text-slate-500">No option groups yet.</p>}
    </div>
  )
}
