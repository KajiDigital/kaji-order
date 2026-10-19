'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  categoryId: string
  name: string
  onRenamed: () => void
}

export function CategoryTitle({ categoryId, name, onRenamed }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValue(name)
  }, [name])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  async function commit() {
    const trimmed = value.trim()
    if (!trimmed || trimmed === name) {
      setValue(name)
      setEditing(false)
      return
    }
    await fetch(`/api/menu/categories/${categoryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    })
    setEditing(false)
    onRenamed()
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="menu-builder-field menu-builder-field--title menu-builder-category-title"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          }
          if (e.key === 'Escape') {
            setValue(name)
            setEditing(false)
          }
        }}
      />
    )
  }

  return (
    <button
      type="button"
      className="menu-builder-category-title-btn"
      onClick={() => setEditing(true)}
      title="Click to rename"
    >
      {name}
    </button>
  )
}
