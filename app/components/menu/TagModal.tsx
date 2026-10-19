'use client'

import { useEffect, useState } from 'react'
import { TAG_COLORS, type MenuTagKind } from '@/app/lib/menu-tags'

export type MenuTagForm = {
  id?: string
  name: string
  color: string
  kind: MenuTagKind
}

type Props = {
  open: boolean
  kind: MenuTagKind
  initial?: MenuTagForm | null
  onClose: () => void
  onSave: (form: MenuTagForm) => Promise<void>
  onDelete?: () => Promise<void>
}

export function TagModal({ open, kind, initial, onClose, onSave, onDelete }: Props) {
  const [form, setForm] = useState<MenuTagForm>({
    name: '',
    color: TAG_COLORS[0],
    kind,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const title = kind === 'DIETARY' ? 'Dietary tag' : 'Allergen tag'
  const isEdit = Boolean(initial?.id)

  useEffect(() => {
    if (open) {
      setForm(
        initial ?? {
          name: '',
          color: TAG_COLORS[0],
          kind,
        }
      )
      setError('')
    }
  }, [open, initial, kind])

  if (!open) return null

  async function handleSave() {
    const trimmed = form.name.trim()
    if (!trimmed) {
      setError('Name is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({ ...form, name: trimmed, kind })
      onClose()
    } catch {
      setError('Could not save tag')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        data-menu-builder
        className="menu-builder-card w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="tag-modal-title"
      >
        <div className="flex justify-between items-start mb-5">
          <p
            id="tag-modal-title"
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: 'var(--mb-muted)' }}
          >
            {isEdit ? `Edit ${title.toLowerCase()}` : `New ${title.toLowerCase()}`}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-xl leading-none"
            style={{ color: 'var(--mb-muted)' }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <label className="menu-builder-label">Name</label>
        <input
          className="menu-builder-input mb-4"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder={kind === 'DIETARY' ? 'e.g. Vegan' : 'e.g. Nuts'}
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />

        <p className="menu-builder-label mb-2">Colour</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {TAG_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm({ ...form, color: c })}
              className="w-8 h-8 rounded-full border-2 transition-transform"
              style={{
                background: c,
                borderColor: form.color === c ? 'var(--mb-text)' : 'transparent',
                transform: form.color === c ? 'scale(1.1)' : 'scale(1)',
              }}
              aria-label={`Colour ${c}`}
            />
          ))}
        </div>

        {error && (
          <p className="text-sm mb-4" style={{ color: '#dc2626' }}>
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-4 border-t" style={{ borderColor: 'var(--mb-border)' }}>
          {onDelete && (
            <button
              type="button"
              onClick={async () => {
                if (!confirm(`Delete "${form.name}"?`)) return
                await onDelete()
                onClose()
              }}
              className="menu-builder-btn-secondary"
              style={{ color: '#dc2626' }}
            >
              Delete
            </button>
          )}
          <button type="button" onClick={onClose} className="menu-builder-btn-secondary flex-1">
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="menu-builder-btn-primary flex-1 disabled:opacity-50"
          >
            {saving ? 'Saving…' : isEdit ? 'Save' : 'Create tag'}
          </button>
        </div>
      </div>
    </div>
  )
}
