'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function AccountMenu({
  slug,
  primary,
}: {
  slug: string
  primary: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  async function logout() {
    setOpen(false)
    await fetch('/api/customer/logout', { method: 'POST' })
    router.push(`/${slug}`)
    router.refresh()
  }

  return (
    <div ref={rootRef} className="relative ml-auto">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-semibold text-white"
        style={{ backgroundColor: primary }}
        aria-expanded={open}
      >
        Account
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl bg-white py-1 shadow-lg ring-1 ring-stone-200">
          <Link
            href={`/${slug}/account`}
            onClick={() => setOpen(false)}
            className="block cursor-pointer px-4 py-2.5 text-sm text-stone-800 hover:bg-stone-50"
          >
            Dashboard
          </Link>
          <Link
            href={`/${slug}/account/history`}
            onClick={() => setOpen(false)}
            className="block cursor-pointer px-4 py-2.5 text-sm text-stone-800 hover:bg-stone-50"
          >
            Order history archive
          </Link>
          <Link
            href={`/${slug}/account/details`}
            onClick={() => setOpen(false)}
            className="block cursor-pointer px-4 py-2.5 text-sm text-stone-800 hover:bg-stone-50"
          >
            Account details
          </Link>
          <Link
            href={`/${slug}`}
            onClick={() => setOpen(false)}
            className="block cursor-pointer px-4 py-2.5 text-sm text-stone-800 hover:bg-stone-50"
          >
            New order
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="block w-full cursor-pointer px-4 py-2.5 text-left text-sm text-stone-600 hover:bg-stone-50"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
