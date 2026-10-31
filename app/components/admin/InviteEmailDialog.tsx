'use client'

import { useEffect, useState } from 'react'

type Draft = {
  to: string
  login_email: string
  subject: string
  body: string
  temp_password: string
  has_login: boolean
}

export function InviteEmailDialog({
  restaurantId,
  restaurantName,
  onClose,
  onSent,
}: {
  restaurantId: string
  restaurantName: string
  onClose: () => void
  onSent: (to: string) => void
}) {
  const [draft, setDraft] = useState<Draft | null>(null)
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      const res = await fetch(`/api/admin/restaurants/${restaurantId}/send-invite`)
      const json = await res.json()
      if (cancelled) return
      if (!res.ok) {
        setError(json.error ?? 'Could not load invite email')
        setLoading(false)
        return
      }
      setDraft(json)
      setTo(json.to)
      setSubject(json.subject)
      setBody(json.body)
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [restaurantId])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function send() {
    if (!draft) return
    setSending(true)
    setError('')
    const res = await fetch(`/api/admin/restaurants/${restaurantId}/send-invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        subject,
        body,
        temp_password: draft.temp_password,
      }),
    })
    const json = await res.json()
    setSending(false)
    if (!res.ok) {
      setError(json.error ?? 'Could not send invite')
      return
    }
    onSent(json.to ?? to)
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-email-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="invite-email-title" className="text-lg font-semibold text-white">
          Send invite email
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Review and edit the message for {restaurantName} before sending.
        </p>

        {loading && <p className="mt-6 text-sm text-slate-400">Loading message...</p>}

        {!loading && draft && (
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs text-slate-400">To</span>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-400">Subject</span>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-400">Message</span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={12}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
              />
            </label>
            <p className="text-xs text-slate-500">
              Dashboard login: {draft.login_email}. Keep the temporary password in the
              message so they can sign in.
              {!draft.has_login && ' Sending this will create their first login.'}
            </p>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Preview</p>
              <p className="whitespace-pre-wrap text-sm text-slate-200">{body}</p>
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void send()}
            disabled={loading || sending || !draft}
            className="cursor-pointer rounded-lg bg-violet-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send invite'}
          </button>
        </div>
      </div>
    </div>
  )
}
