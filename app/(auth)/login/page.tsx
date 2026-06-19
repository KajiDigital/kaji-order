'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthShell } from '@/app/components/auth/AuthShell'
import { AuthCard } from '@/app/components/auth/AuthCard'
import { AuthField } from '@/app/components/auth/AuthField'
import { AuthButton } from '@/app/components/auth/AuthButton'
import { AuthAlert } from '@/app/components/auth/AuthAlert'
import { AuthCrossLink, AuthFooterLink } from '@/app/components/auth/AuthFooterLink'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
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

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <AuthShell theme="restaurant">
      <AuthCard
        title="Sign in to your restaurant"
        subtitle="Manage orders, menu and settings"
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

        <div className="mt-6 space-y-3">
          <AuthFooterLink>
            No account?{' '}
            <Link href="/register">Register your restaurant</Link>
          </AuthFooterLink>
          <AuthCrossLink
            prefix="Platform admin?"
            href="/admin-login"
            linkText="Sign in to admin panel"
          />
        </div>
      </AuthCard>
    </AuthShell>
  )
}
