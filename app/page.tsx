import Link from 'next/link'

export default function HomePage() {
  return (
    <div
      data-auth-theme="restaurant"
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ background: '#fafaf9', color: '#1c1917', fontFamily: 'var(--font-schibsted, var(--font-geist-sans)), system-ui, sans-serif' }}
    >
      <h1
        className="text-4xl font-semibold mb-2 text-center"
        style={{ fontFamily: 'var(--font-newsreader, Georgia), serif' }}
      >
        Kaji Order
      </h1>
      <p className="mb-10 text-center max-w-md text-base" style={{ color: '#78716c' }}>
        White-label online ordering for restaurants. Part of the Kaji POS ecosystem.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/register"
          className="px-6 py-3 rounded-lg font-semibold text-white text-sm transition-opacity hover:opacity-90"
          style={{ background: '#e2562a' }}
        >
          Register your restaurant
        </Link>
        <Link
          href="/login"
          className="px-6 py-3 rounded-lg font-semibold text-sm border transition-colors hover:opacity-90"
          style={{ background: '#f5f5f4', color: '#1c1917', borderColor: '#e7e5e4' }}
        >
          Restaurant sign in
        </Link>
      </div>
      <p className="mt-8 text-sm" style={{ color: '#a8a29e' }}>
        <Link href="/admin-login" className="hover:underline" style={{ color: '#78716c' }}>
          Platform admin
        </Link>
      </p>
    </div>
  )
}
