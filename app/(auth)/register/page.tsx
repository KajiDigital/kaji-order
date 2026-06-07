'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { slugify, getAppUrl } from '@/app/lib/utils'

const PLANS = [
  { id: 'COMMISSION', name: 'Commission', price: '£0/month', detail: '5% per order' },
  { id: 'MONTHLY', name: 'Monthly', price: '£39/month', detail: '0% commission' },
  { id: 'WEEKLY', name: 'Weekly', price: '£9.99/week', detail: '0% commission' },
  { id: 'BUNDLE', name: 'Bundle', price: '£29/month', detail: 'With kaji-pos CLOUD' },
]

export default function RegisterPage() {
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-1">Register your restaurant</h1>
        <p className="text-slate-400 text-sm mb-6">Step {step} of 3</p>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Restaurant name</label>
              <input
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">URL slug</label>
              <input
                value={slug}
                onChange={(e) => {
                  setSlugEdited(true)
                  setSlug(slugify(e.target.value))
                }}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white"
              />
              <p className="text-xs text-slate-500 mt-1">
                {appHost}/{slug || 'your-slug'}
              </p>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Phone (optional)</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white"
              />
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!name || !slug || !email || !password}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-lg disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            {PLANS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlan(p.id)}
                className={`w-full text-left p-4 rounded-xl border ${
                  plan === p.id
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex justify-between">
                  <span className="font-medium text-white">{p.name}</span>
                  <span className="text-violet-400">{p.price}</span>
                </div>
                <p className="text-sm text-slate-400">{p.detail}</p>
              </button>
            ))}
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setStep(1)} className="flex-1 py-2 text-slate-400">
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 bg-violet-600 text-white py-2.5 rounded-lg"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
              <p className="text-white font-medium mb-1">Connect Stripe</p>
              <p className="text-sm text-slate-400">
                Accept card payments from customers. You can set this up later from Billing.
              </p>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(2)} className="flex-1 py-2 text-slate-400">
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-violet-600 text-white py-2.5 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Set up later & go to dashboard'}
              </button>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="text-violet-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
