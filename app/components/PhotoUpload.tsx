'use client'

import { useRef, useState } from 'react'
import { uploadResizedImage, type UploadKind } from '@/app/lib/menu-image'

type Props = {
  value: string
  onChange: (url: string) => void
  kind: UploadKind
  label?: string
}

export function PhotoUpload({
  value,
  onChange,
  kind,
  label = 'Choose photo',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return

    setBusy(true)
    setError('')
    try {
      onChange(await uploadResizedImage(file, kind))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process that image.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        aria-hidden
        onChange={handleFile}
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? 'Uploading…' : label}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-sm text-slate-400 hover:text-white cursor-pointer"
          >
            Remove
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}
