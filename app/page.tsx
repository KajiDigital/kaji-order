import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-2">Kaji Order</h1>
      <p className="text-slate-400 mb-8 text-center max-w-md">
        White-label online ordering for restaurants. Part of the Kaji POS ecosystem.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link href="/register" className="px-6 py-3 bg-violet-600 rounded-xl font-medium hover:bg-violet-500">
          Register restaurant
        </Link>
        <Link href="/login" className="px-6 py-3 bg-slate-800 rounded-xl font-medium hover:bg-slate-700">
          Restaurant login
        </Link>
        <Link href="/admin-login" className="px-6 py-3 border border-slate-700 rounded-xl text-slate-400 hover:text-white">
          Admin
        </Link>
      </div>
    </div>
  )
}
