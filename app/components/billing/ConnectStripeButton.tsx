'use client'

export function ConnectStripeButton() {
  return (
    <button
      type="button"
      onClick={async () => {
        const res = await fetch('/api/stripe/connect', { method: 'POST' })
        const data = await res.json()
        if (data.url) window.location.href = data.url
        else alert(data.error ?? 'Stripe not configured yet')
      }}
      className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm"
    >
      Connect Stripe
    </button>
  )
}
