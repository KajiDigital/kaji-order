'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ImpersonationBanner } from '@/app/components/dashboard/ImpersonationBanner'

type Session = {
  name: string
  email: string
  restaurant: {
    name: string
    slug: string
    brand_color: string
  }
}

export function DashboardShell({
  session,
  impersonating,
  children,
}: {
  session: Session
  impersonating?: { restaurantId: string; restaurantName: string } | null
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const nav = [
    { href: '/dashboard', label: 'Overview' },
    { href: '/dashboard/orders', label: 'Orders' },
    { href: '/dashboard/menu', label: 'Menu' },
    { href: '/dashboard/promotions', label: 'Promotions' },
    { href: '/dashboard/settings', label: 'Settings' },
    { href: '/dashboard/billing', label: 'Billing' },
  ]

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {impersonating && (
        <ImpersonationBanner restaurantName={impersonating.restaurantName} />
      )}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded-lg shrink-0"
              style={{ backgroundColor: session.restaurant.brand_color }}
            />
            <div className="min-w-0">
              <p className="font-semibold truncate">{session.restaurant.name}</p>
              <p className="text-xs text-slate-400 truncate">{session.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-sm text-slate-400 hover:text-white shrink-0"
          >
            Sign out
          </button>
        </div>
        <nav className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto pb-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
