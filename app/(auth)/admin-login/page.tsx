'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthShell } from '@/app/components/auth/AuthShell'
import { AuthCard } from '@/app/components/auth/AuthCard'
import { AuthField } from '@/app/components/auth/AuthField'
import { AuthButton } from '@/app/components/auth/AuthButton'
import { AuthAlert } from '@/app/components/auth/AuthAlert'
import { AuthCrossLink } from '@/app/components/auth/AuthFooterLink'

function ShieldIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden>
      <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.75.75 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516 11.209 11.209 0 01-7.877-3.08zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zM12 15a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
    </svg>
  )
}

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Login failed')
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <AuthShell theme="admin">
      <AuthCard
        title="Kaji Platform Admin"
        subtitle="Internal platform administration"
        badge="Staff only — not for restaurant accounts"
        icon={<ShieldIcon />}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthField
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <AuthField
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {error && <AuthAlert message={error} />}
          <AuthButton type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </AuthButton>
        </form>

        <div className="mt-6">
          <AuthCrossLink
            prefix="Restaurant owner?"
            href="/login"
            linkText="Sign in to your dashboard"
          />
        </div>
      </AuthCard>
    </AuthShell>
  )
}
