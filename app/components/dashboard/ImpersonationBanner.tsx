'use client'

import { useRouter } from 'next/navigation'

export function ImpersonationBanner({
  restaurantName,
}: {
  restaurantName: string
}) {
  const router = useRouter()

  async function exitImpersonation() {
    const res = await fetch('/api/auth/exit-impersonation', { method: 'POST' })
    const data = await res.json()
    if (data.redirect) {
      window.location.href = data.redirect
    } else {
      router.refresh()
    }
  }

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 text-sm font-medium flex items-center justify-between gap-4">
      <span>👁 Viewing as {restaurantName}</span>
      <button
        type="button"
        onClick={exitImpersonation}
        className="underline font-semibold hover:no-underline shrink-0"
      >
        Exit
      </button>
    </div>
  )
}
