'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { slugify, getAppUrl } from '@/app/lib/utils'
import { AuthField } from '@/app/components/auth/AuthField'
import { AuthButton } from '@/app/components/auth/AuthButton'
import { AuthAlert } from '@/app/components/auth/AuthAlert'

const PLANS = [
  {
    id: 'COMMISSION',
    name: 'Commission plan',
    detail: 'Pay only when you earn. No monthly fee.',
  },
  {
    id: 'MONTHLY',
    name: 'Monthly £39',
    detail: 'Unlimited orders, flat monthly fee.',
  },
  {
    id: 'WEEKLY',
    name: 'Weekly £9.99',
    detail: 'Flexible weekly billing.',
  },
]

export function SelfServeRegisterForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [plan, setPlan] = useState('COMMISSION')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function onNameChange(value: string) {
    setName(value)
    if (!slugEdited) setSlug(slugify(value))
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        slug,
        email,
        password,
        phone,
        pricing_plan: plan,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Registration failed')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const appHost = getAppUrl().replace(/^https?:\/\//, '')

  return (
    <>
      <p className="text-sm mb-6" style={{ color: 'var(--auth-text-muted)' }}>
        Step {step} of 3
      </p>

      {step === 1 && (
        <div className="space-y-4">
          <AuthField
            label="Restaurant name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
          />
          <AuthField
            label="URL slug"
            value={slug}
            onChange={(e) => {
              setSlugEdited(true)
              setSlug(slugify(e.target.value))
            }}
            hint={`${appHost}/${slug || 'your-slug'}`}
          />
          <AuthField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <AuthField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <AuthField
            label="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <AuthButton
            type="button"
            onClick={() => setStep(2)}
            disabled={!name || !slug || !email || !password}
          >
            Continue
          </AuthButton>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          {PLANS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlan(p.id)}
              className="w-full text-left p-4 rounded-lg border transition-colors"
              style={{
                borderColor: plan === p.id ? 'var(--auth-accent)' : 'var(--auth-border)',
                background: plan === p.id ? 'color-mix(in srgb, var(--auth-accent) 8%, var(--auth-card))' : 'var(--auth-card)',
              }}
            >
              <span className="font-medium" style={{ color: 'var(--auth-text)' }}>
                {p.name}
              </span>
              <p className="text-sm mt-1" style={{ color: 'var(--auth-text-muted)' }}>
                {p.detail}
              </p>
            </button>
          ))}
          <div className="flex gap-2 pt-2">
            <AuthButton type="button" variant="secondary" onClick={() => setStep(1)}>
              Back
            </AuthButton>
            <AuthButton type="button" onClick={() => setStep(3)}>
              Continue
            </AuthButton>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div
            className="p-4 rounded-lg border"
            style={{ background: 'var(--auth-hover-bg)', borderColor: 'var(--auth-border)' }}
          >
            <p className="font-medium mb-1" style={{ color: 'var(--auth-text)' }}>
              Connect Stripe
            </p>
            <p className="text-sm" style={{ color: 'var(--auth-text-muted)' }}>
              Accept card payments from customers. You can set this up later from Billing.
            </p>
          </div>
          {error && <AuthAlert message={error} />}
          <div className="flex gap-2">
            <AuthButton type="button" variant="secondary" onClick={() => setStep(2)}>
              Back
            </AuthButton>
            <AuthButton type="button" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Creating...' : 'Set up later & go to dashboard'}
            </AuthButton>
          </div>
        </div>
      )}
    </>
  )
}
