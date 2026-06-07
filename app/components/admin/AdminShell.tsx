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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900 px-4 py-4 flex items-center justify-between">
        <div>
          <p className="font-bold text-violet-400">Kaji Order Admin</p>
          <p className="text-xs text-slate-400">{admin.email}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className={`text-sm ${pathname === '/admin' ? 'text-white' : 'text-slate-400'}`}
          >
            Dashboard
          </Link>
          <Link
            href="/admin/restaurants"
            className={`text-sm ${pathname.startsWith('/admin/restaurants') ? 'text-white' : 'text-slate-400'}`}
          >
            Restaurants
          </Link>
          <Link
            href="/admin/settings"
            className={`text-sm ${pathname === '/admin/settings' ? 'text-white' : 'text-slate-400'}`}
          >
            Settings
          </Link>
          <button type="button" onClick={logout} className="text-sm text-slate-400 hover:text-white">
            Sign out
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
