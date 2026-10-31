'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Props = {
  slug: string
  primary: string
}

export function CustomerAccountLinks({ slug, primary }: Props) {
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/customer/me?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setName(data.customer?.name ?? null)
      })
      .catch(() => {
        if (!cancelled) setName(null)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  if (name) {
    return (
      <Link
        href={`/${slug}/account`}
        className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/95 px-2.5 py-1.5 text-sm font-semibold text-stone-800 shadow-lg ring-1 ring-black/5 backdrop-blur hover:bg-white"
      >
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: primary }}
        >
          {name.charAt(0).toUpperCase()}
        </span>
        <span className="pr-1.5">Account</span>
      </Link>
    )
  }

  return (
    <Link
      href={`/${slug}/account/login`}
      className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-stone-800 shadow-lg ring-1 ring-black/5 backdrop-blur hover:bg-white"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
      Log in
    </Link>
  )
}
