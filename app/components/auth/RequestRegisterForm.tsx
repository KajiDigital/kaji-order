'use client'

import { useState } from 'react'
import Link from 'next/link'

const RESTAURANT_TYPES = [
  'Takeaway',
  'Restaurant',
  'Cafe',
  'Pub',
  'Dark kitchen',
  'Other',
]

export function RequestRegisterForm() {
  const [restaurantName, setRestaurantName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [restaurantType, setRestaurantType] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurant_name: restaurantName,
        contact_name: contactName,
        email,
        phone,
        restaurant_type: restaurantType,
        description,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Request failed')
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="text-center py-4">
        <p className="text-4xl mb-4">✓</p>
        <h2 className="text-xl font-bold text-white mb-2">Thank you!</h2>
        <p className="text-slate-400">
          We&apos;ll be in touch within 24 hours.
        </p>
        <Link href="/" className="inline-block mt-6 text-violet-400 text-sm hover:underline">
          Back to home
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-slate-300 mb-1">Restaurant name</label>
        <input
          required
          value={restaurantName}
          onChange={(e) => setRestaurantName(e.target.value)}
          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white"
        />
      </div>
      <div>
        <label className="block text-sm text-slate-300 mb-1">Your name</label>
        <input
          required
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white"
        />
      </div>
      <div>
        <label className="block text-sm text-slate-300 mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white"
        />
      </div>
      <div>
        <label className="block text-sm text-slate-300 mb-1">Phone</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white"
        />
      </div>
      <div>
        <label className="block text-sm text-slate-300 mb-1">Restaurant type</label>
        <select
          required
          value={restaurantType}
          onChange={(e) => setRestaurantType(e.target.value)}
          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white"
        >
          <option value="">Select type</option>
          {RESTAURANT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm text-slate-300 mb-1">Brief description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white"
          placeholder="Tell us about your restaurant..."
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-lg disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Request access'}
      </button>
    </form>
  )
}
