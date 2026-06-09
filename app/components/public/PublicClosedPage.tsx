import Link from 'next/link'

type Props = {
  slug: string
  name: string
  primaryColor: string
  statusMessage: string
  nextOpenTime: string | null
  nextOpenDay: string | null
}

export function PublicClosedPage({
  slug,
  name,
  primaryColor,
  statusMessage,
  nextOpenTime,
  nextOpenDay,
}: Props) {
  const opensLabel =
    nextOpenTime && nextOpenDay
      ? nextOpenDay === 'today'
        ? `Opens today at ${nextOpenTime}`
        : nextOpenDay === 'tomorrow'
          ? `Opens tomorrow at ${nextOpenTime}`
          : `Opens ${nextOpenDay} at ${nextOpenTime}`
      : statusMessage

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center bg-white rounded-2xl border border-stone-200 p-8 shadow-sm">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-white text-2xl"
          style={{ backgroundColor: primaryColor }}
          aria-hidden
        >
          🕐
        </div>
        <h1 className="text-2xl font-bold text-stone-900">{name}</h1>
        <p className="mt-2 text-lg font-semibold text-stone-800">We&apos;re closed</p>
        <p className="mt-3 text-stone-600">{opensLabel}</p>
        <Link
          href={`/${slug}`}
          className="inline-block mt-6 text-sm font-medium hover:underline"
          style={{ color: primaryColor }}
        >
          Refresh page
        </Link>
      </div>
    </div>
  )
}
