'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function AdminShell({
  admin,
  children,
}: {
  admin: { email: string }
  children: React.ReactNode
}) {
  const pathname = usePathname()

  async function logout() {
    await fetch('/api/auth/admin-login', { method: 'DELETE' })
    window.location.href = '/admin-login'
  }

  return (
    <div className="scheme-dark min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900 px-4 py-4 flex items-center justify-between">
        <div>
          <p className="font-bold text-violet-400">Kaji Order Admin</p>
          <p className="text-xs text-slate-400">{admin.email}</p>
        </div>
        <div className="flex items-center gap-4">
          {[
            { href: '/admin', label: 'Dashboard', match: pathname === '/admin' },
            { href: '/admin/reports', label: 'Reports', match: pathname.startsWith('/admin/reports') },
            { href: '/admin/restaurants', label: 'Restaurants', match: pathname.startsWith('/admin/restaurants') },
            { href: '/admin/customers', label: 'Customers', match: pathname.startsWith('/admin/customers') },
            { href: '/admin/settings', label: 'Settings', match: pathname === '/admin/settings' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`cursor-pointer text-sm ${item.match ? 'text-white' : 'text-slate-400'}`}
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={logout}
            className="cursor-pointer text-sm text-slate-400 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
