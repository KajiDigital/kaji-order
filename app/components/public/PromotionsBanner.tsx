'use client'

export function PromotionsBanner({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null

  const text = messages.map((m) => `🎉 ${m}`).join(' · ')

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto max-w-7xl overflow-x-auto px-4 py-2.5 sm:px-6">
        <p className="whitespace-nowrap text-sm font-medium text-amber-900">{text}</p>
      </div>
    </div>
  )
}
