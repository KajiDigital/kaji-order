'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatPence } from '@/app/lib/utils'

type Restaurant = {
  id: string
  name: string
  slug: string
  email?: string | null
  phone?: string | null
  contact_name?: string | null
  restaurant_type?: string | null
  description?: string | null
  status: string
  pricing_plan: string
  ordersToday: number
  commissionToday: number
}

export function AdminRestaurantsClient({
  restaurants,
}: {
  restaurants: Restaurant[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') ?? 'active'

  const pending = restaurants.filter((r) => r.status === 'pending')
  const active = restaurants.filter((r) => r.status === 'active')
  const other = restaurants.filter((r) => !['pending', 'active'].includes(r.status))

  const list =
    tab === 'pending' ? pending : tab === 'all' ? restaurants : active

  async function approve(id: string) {
    if (!confirm('Approve this restaurant and send invite email?')) return
    const res = await fetch(`/api/admin/restaurants/${id}/approve`, { method: 'POST' })
    if (res.ok) router.refresh()
    else alert((await res.json()).error ?? 'Approve failed')
  }

  async function reject(id: string) {
    if (!confirm('Reject this registration request?')) return
    const res = await fetch(`/api/admin/restaurants/${id}/reject`, { method: 'POST' })
    if (res.ok) router.refresh()
    else alert((await res.json()).error ?? 'Reject failed')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Restaurants</h1>

      <div className="flex gap-2 mb-6">
        {[
          { id: 'pending', label: `Pending (${pending.length})` },
          { id: 'active', label: `Active (${active.length})` },
          { id: 'all', label: 'All' },
        ].map((t) => (
          <Link
            key={t.id}
            href={`/admin/restaurants?tab=${t.id}`}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              tab === t.id ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {list.length === 0 && (
          <p className="text-slate-500 text-sm">No restaurants in this tab.</p>
        )}

        {list.map((r) => (
          <div
            key={r.id}
            className="bg-slate-900 border border-slate-800 rounded-lg p-4"
          >
            {tab === 'pending' ? (
              <>
                <p className="font-medium text-white">{r.name}</p>
                <p className="text-sm text-slate-400 mt-1">
                  {r.contact_name} · {r.email}
                  {r.phone ? ` · ${r.phone}` : ''}
                </p>
                {r.restaurant_type && (
                  <p className="text-sm text-slate-500 mt-1">Type: {r.restaurant_type}</p>
                )}
                {r.description && (
                  <p className="text-sm text-slate-500 mt-2">{r.description}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => approve(r.id)}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => reject(r.id)}
                    className="px-3 py-1.5 bg-red-600/80 text-white rounded-lg text-sm"
                  >
                    Reject
                  </button>
                  {r.email && (
                    <a
                      href={`mailto:${r.email}`}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-sm"
                    >
                      Contact
                    </a>
                  )}
                </div>
              </>
            ) : (
              <Link href={`/admin/restaurants/${r.id}`} className="block hover:opacity-90">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium text-white">{r.name}</p>
                    <p className="text-sm text-slate-500">
                      {r.email} · {r.pricing_plan} · {r.status}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-slate-300">{r.ordersToday} orders today</p>
                    <p className="text-violet-400">{formatPence(r.commissionToday)}</p>
                  </div>
                </div>
              </Link>
            )}
          </div>
        ))}

        {other.length > 0 && tab === 'all' && (
          <p className="text-xs text-slate-600 pt-2">
            Includes {other.length} suspended/rejected
          </p>
        )}
      </div>
    </div>
  )
}
