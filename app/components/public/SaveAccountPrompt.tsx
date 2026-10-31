'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function SaveAccountPrompt({
  slug,
  name,
  email,
  phone,
  loggedIn,
}: {
  slug: string
  name: string
  email: string
  phone?: string | null
  loggedIn: boolean
}) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (loggedIn) {
    return (
      <Link
        href={`/${slug}/account`}
        className="mt-4 inline-block text-sm text-violet-600 hover:underline"
      >
        View my orders
      </Link>
    )
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/customer/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, name, email, phone, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error ?? 'Could not save account')
      return
    }
    router.push(`/${slug}/account`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSave} className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
      <p className="text-sm font-medium text-slate-900">Save these details for next time?</p>
      <p className="mt-1 text-xs text-slate-500">
        Optional. Guest checkout stays available.{' '}
        <Link href={`/${slug}/privacy`} className="underline">
          Privacy
        </Link>
      </p>
      <input
        required
        minLength={8}
        type="password"
        placeholder="Choose a password (min 8 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mt-3 w-full rounded-xl border bg-white px-4 py-3 text-stone-900"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-3 w-full rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save my details'}
      </button>
    </form>
  )
}
