'use client'

import { useEffect, useState } from 'react'

const CATEGORY_COLORS = [
  '#EA580C',
  '#DC2626',
  '#EAB308',
  '#10B981',
  '#06B6D4',
  '#8B5CF6',
  '#EC4899',
  '#F59E0B',
  '#6366F1',
  '#14B8A6',
  '#64748b',
]

type Props = {
  open: boolean
  onClose: () => void
  onSave: (name: string, color: string) => Promise<void>
}

export function CategoryModal({ open, onClose, onSave }: Props) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(CATEGORY_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setName('')
      setColor(CATEGORY_COLORS[0])
      setError('')
    }
  }, [open])

  if (!open) return null

  async function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Category name is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave(trimmed, color)
      onClose()
    } catch {
      setError('Could not create category')
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
        aria-labelledby="category-modal-title"
      >
        <div className="flex justify-between items-start mb-5">
          <p
            id="category-modal-title"
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: 'var(--mb-muted)' }}
          >
            New category
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
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Starters"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />

        <p className="menu-builder-label mb-2">Colour</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-8 h-8 rounded-full border-2 transition-transform"
              style={{
                background: c,
                borderColor: color === c ? 'var(--mb-text)' : 'transparent',
                transform: color === c ? 'scale(1.1)' : 'scale(1)',
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
          <button type="button" onClick={onClose} className="menu-builder-btn-secondary flex-1">
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="menu-builder-btn-primary flex-1 disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Create category'}
          </button>
        </div>
      </div>
    </div>
  )
}
