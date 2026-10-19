'use client'

import { useEffect, useState } from 'react'
import { parsePoundsToPence } from '@/app/lib/utils'

export type OptionSetChoiceForm = {
  id?: string
  name: string
  price: string
  is_default: boolean
}

export type OptionSetForm = {
  id?: string
  name: string
  group_type: 'SINGLE' | 'MULTIPLE' | 'OPTIONAL'
  required: boolean
  choices: OptionSetChoiceForm[]
}

type Props = {
  open: boolean
  initial?: OptionSetForm | null
  onClose: () => void
  onSave: (form: OptionSetForm) => Promise<void>
  onDelete?: () => Promise<void>
}

const EMPTY: OptionSetForm = {
  name: '',
  group_type: 'SINGLE',
  required: true,
  choices: [
    { name: 'Regular', price: '0.00', is_default: true },
    { name: 'Large', price: '1.50', is_default: false },
  ],
}

function groupTypeLabel(type: string) {
  if (type === 'MULTIPLE') return 'Choose several'
  if (type === 'OPTIONAL') return 'Optional extras'
  return 'Choose one'
}

export function OptionSetModal({ open, initial, onClose, onSave, onDelete }: Props) {
  const [form, setForm] = useState<OptionSetForm>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(
        initial ?? {
          ...EMPTY,
          choices: [{ name: '', price: '0.00', is_default: true }],
        }
      )
      setError('')
    }
  }, [open, initial])

  if (!open) return null

  function setGroupType(group_type: OptionSetForm['group_type']) {
    const required = group_type === 'SINGLE' ? form.required : group_type === 'MULTIPLE'
    setForm({ ...form, group_type, required: group_type === 'OPTIONAL' ? false : required })
  }

  function setDefaultChoice(index: number) {
    setForm({
      ...form,
      choices: form.choices.map((c, i) => ({
        ...c,
        is_default: form.group_type === 'SINGLE' ? i === index : c.is_default,
      })),
    })
  }

  function updateChoice(index: number, patch: Partial<OptionSetChoiceForm>) {
    setForm({
      ...form,
      choices: form.choices.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    })
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError('Name is required')
      return
    }
    if (form.choices.length === 0 || form.choices.some((c) => !c.name.trim())) {
      setError('Each choice needs a name')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave(form)
      onClose()
    } catch {
      setError('Could not save option set')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        data-menu-builder
        className="menu-builder-card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="option-set-title"
      >
        <div className="flex justify-between items-start mb-5">
          <p
            id="option-set-title"
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: 'var(--mb-muted)' }}
          >
            Option set
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

        <input
          className="menu-builder-input text-xl font-semibold mb-5"
          style={{ fontFamily: 'var(--mb-heading)' }}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Size"
        />

        <div
          className="flex gap-1 p-1 rounded-lg mb-4"
          style={{ background: 'var(--mb-hover)' }}
        >
          {(['SINGLE', 'MULTIPLE', 'OPTIONAL'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setGroupType(type)}
              className="flex-1 py-2 px-2 rounded-md text-xs font-semibold transition-colors"
              style={{
                background: form.group_type === type ? '#fff' : 'transparent',
                color: form.group_type === type ? 'var(--mb-text)' : 'var(--mb-muted)',
                boxShadow: form.group_type === type ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              {groupTypeLabel(type)}
            </button>
          ))}
        </div>

        {form.group_type !== 'OPTIONAL' && (
          <label className="flex items-center gap-3 mb-5 cursor-pointer">
            <button
              type="button"
              role="switch"
              aria-checked={form.required}
              onClick={() => setForm({ ...form, required: !form.required })}
              className="relative w-11 h-6 rounded-full transition-colors"
              style={{ background: form.required ? 'var(--mb-text)' : 'var(--mb-border)' }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                style={{ transform: form.required ? 'translateX(20px)' : 'translateX(0)' }}
              />
            </button>
            <span className="text-sm font-medium">Required</span>
          </label>
        )}

        <div className="space-y-2 mb-3">
          {form.choices.map((choice, index) => (
            <div key={choice.id ?? index} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDefaultChoice(index)}
                className="shrink-0 text-lg"
                style={{ color: choice.is_default ? 'var(--mb-accent)' : 'var(--mb-hint)' }}
                title="Default choice"
                aria-label="Set as default"
              >
                {choice.is_default ? '★' : '☆'}
              </button>
              <input
                className="menu-builder-input flex-1"
                value={choice.name}
                onChange={(e) => updateChoice(index, { name: e.target.value })}
                placeholder="Choice name"
              />
              <div className="flex items-center shrink-0 text-sm" style={{ color: 'var(--mb-muted)' }}>
                <span className="mr-1">+ £</span>
                <input
                  className="menu-builder-input w-20"
                  value={choice.price}
                  onChange={(e) => updateChoice(index, { price: e.target.value })}
                  inputMode="decimal"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    choices: form.choices.filter((_, i) => i !== index),
                  })
                }
                className="shrink-0 px-2"
                style={{ color: 'var(--mb-muted)' }}
                aria-label="Remove choice"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            setForm({
              ...form,
              choices: [...form.choices, { name: '', price: '0.00', is_default: false }],
            })
          }
          className="text-sm font-semibold mb-6"
          style={{ color: 'var(--mb-accent)' }}
        >
          + Add choice
        </button>

        {error && (
          <p className="text-sm mb-4" style={{ color: '#dc2626' }}>
            {error}
          </p>
        )}

        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--mb-border)' }}>
          {onDelete && initial?.id ? (
            <button
              type="button"
              onClick={async () => {
                if (!confirm('Delete this option set from all linked items?')) return
                setSaving(true)
                await onDelete()
                onClose()
              }}
              className="text-sm font-medium"
              style={{ color: '#dc2626' }}
            >
              Delete option set
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="menu-builder-btn-primary disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function optionSetFormToPayload(form: OptionSetForm) {
  return {
    name: form.name.trim(),
    group_type: form.group_type,
    required: form.group_type === 'OPTIONAL' ? false : form.required,
    choices: form.choices.map((c) => ({
      id: c.id,
      name: c.name.trim(),
      price_delta: parsePoundsToPence(c.price),
      is_default: c.is_default,
    })),
  }
}

export function attributeSetToForm(set: {
  id: string
  name: string
  group_type: string
  required: boolean
  choices: { id: string; name: string; price_delta: number; is_default: boolean }[]
}): OptionSetForm {
  return {
    id: set.id,
    name: set.name,
    group_type: set.group_type as OptionSetForm['group_type'],
    required: set.required,
    choices: set.choices.map((c) => ({
      id: c.id,
      name: c.name,
      price: (c.price_delta / 100).toFixed(2),
      is_default: c.is_default,
    })),
  }
}
