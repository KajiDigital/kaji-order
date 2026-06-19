'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AuthField } from '@/app/components/auth/AuthField'
import { AuthButton } from '@/app/components/auth/AuthButton'
import { AuthAlert } from '@/app/components/auth/AuthAlert'

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
        <p className="text-4xl mb-4" style={{ color: 'var(--auth-accent)' }}>✓</p>
        <h2 className="auth-heading text-xl font-semibold mb-2">Thank you!</h2>
        <p style={{ color: 'var(--auth-text-muted)' }}>
          We&apos;ll be in touch within 24 hours.
        </p>
        <Link
          href="/"
          className="inline-block mt-6 text-sm font-medium hover:underline"
          style={{ color: 'var(--auth-accent)' }}
        >
          Back to home
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <AuthField
        label="Restaurant name"
        required
        value={restaurantName}
        onChange={(e) => setRestaurantName(e.target.value)}
      />
      <AuthField
        label="Your name"
        required
        value={contactName}
        onChange={(e) => setContactName(e.target.value)}
      />
      <AuthField
        label="Email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <AuthField
        label="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <AuthField
        as="select"
        label="Restaurant type"
        required
        value={restaurantType}
        onChange={(e) => setRestaurantType(e.target.value)}
      >
        <option value="">Select type</option>
        {RESTAURANT_TYPES.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </AuthField>
      <AuthField
        as="textarea"
        label="Brief description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Tell us about your restaurant..."
      />
      {error && <AuthAlert message={error} />}
      <AuthButton type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Request access'}
      </AuthButton>
    </form>
  )
}
