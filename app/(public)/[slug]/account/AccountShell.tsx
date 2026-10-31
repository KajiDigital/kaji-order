import Link from 'next/link'
import { getPrimaryColor } from '@/app/lib/branding'
import { AccountMenu } from './AccountMenu'

export function AccountShell({
  slug,
  restaurantName,
  primaryColor,
  logoUrl,
  title,
  signedIn = false,
  children,
}: {
  slug: string
  restaurantName: string
  primaryColor?: string | null
  logoUrl?: string | null
  title: string
  signedIn?: boolean
  children: React.ReactNode
}) {
  const primary = getPrimaryColor({ primary_color: primaryColor })

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-3">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-10 w-10 rounded-full object-cover ring-1 ring-stone-200" />
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: primary }}
            >
              {restaurantName.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <Link href={`/${slug}`} className="block truncate text-sm font-semibold text-stone-900">
              {restaurantName}
            </Link>
            <p className="text-xs text-stone-500">{title}</p>
          </div>
          {signedIn ? (
            <AccountMenu slug={slug} primary={primary} />
          ) : (
            <Link
              href={`/${slug}/account/login`}
              className="ml-auto cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-semibold text-white"
              style={{ backgroundColor: primary }}
            >
              Account
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 py-6">{children}</main>
    </div>
  )
}
