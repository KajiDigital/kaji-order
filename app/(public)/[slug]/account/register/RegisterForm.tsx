'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function RegisterForm({ slug, primary }: { slug: string; primary: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
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
      setError(data.error ?? 'Could not create account')
      return
    }
    router.push(`/${slug}/account`)
    router.refresh()
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-stone-900">Create account</h1>
      <p className="mt-1 text-sm text-stone-500">
        Save your details for faster checkout at this restaurant. Guest checkout stays available.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <input
          required
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border bg-white px-4 py-3 text-stone-900"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border bg-white px-4 py-3 text-stone-900"
        />
        <input
          type="tel"
          placeholder="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-xl border bg-white px-4 py-3 text-stone-900"
        />
        <input
          required
          minLength={8}
          type="password"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border bg-white px-4 py-3 text-stone-900"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl py-3 font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: primary }}
        >
          {loading ? 'Creating...' : 'Create account'}
        </button>
      </form>
      <p className="mt-4 text-xs text-stone-500">
        We use your details to place and track orders at this restaurant.{' '}
        <Link href={`/${slug}/privacy`} className="underline">
          Privacy
        </Link>
      </p>
      <p className="mt-3 text-sm text-stone-600">
        Already have an account?{' '}
        <Link href={`/${slug}/account/login`} className="hover:underline" style={{ color: primary }}>
          Log in
        </Link>
      </p>
    </>
  )
}
