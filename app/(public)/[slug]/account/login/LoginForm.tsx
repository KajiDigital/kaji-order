'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function LoginForm({ slug, primary }: { slug: string; primary: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/customer/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, email, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error ?? 'Login failed')
      return
    }
    router.push(`/${slug}/account`)
    router.refresh()
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-stone-900">Log in</h1>
      <p className="mt-1 text-sm text-stone-500">Optional — you can still order as a guest.</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <input
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border bg-white px-4 py-3 text-stone-900"
        />
        <input
          required
          type="password"
          placeholder="Password"
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
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <p className="mt-4 text-sm text-stone-600">
        No account?{' '}
        <Link href={`/${slug}/account/register`} className="hover:underline" style={{ color: primary }}>
          Create one
        </Link>
      </p>
    </>
  )
}
