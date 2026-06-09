'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  EMAIL_TEMPLATE_LABELS,
  EMAIL_TEMPLATE_TYPES,
  EMAIL_TEMPLATE_VARIABLES,
  type EmailTemplateType,
} from '@/app/lib/email-templates/constants'

type TemplateRecord = {
  template_type: EmailTemplateType
  subject: string
  html_body: string
  is_custom: boolean
  is_active: boolean
}

export function EmailTemplateEditor({
  restaurantId,
  restaurantName,
}: {
  restaurantId: string
  restaurantName: string
}) {
  const [activeTab, setActiveTab] = useState<EmailTemplateType>('order_confirmation')
  const [templates, setTemplates] = useState<TemplateRecord[]>([])
  const [subject, setSubject] = useState('')
  const [htmlBody, setHtmlBody] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [previewSubject, setPreviewSubject] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadTemplates = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/restaurants/${restaurantId}/email-templates`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to load templates')
      setTemplates(json.templates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }, [restaurantId])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  useEffect(() => {
    const current = templates.find((t) => t.template_type === activeTab)
    if (current) {
      setSubject(current.subject)
      setHtmlBody(current.html_body)
      setIsCustom(current.is_custom)
    }
    setPreviewHtml(null)
    setPreviewSubject(null)
    setMessage(null)
  }, [activeTab, templates])

  async function handleSave() {
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch(
        `/api/admin/restaurants/${restaurantId}/email-templates`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template_type: activeTab,
            subject,
            html_body: htmlBody,
          }),
        }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Save failed')
      setMessage('Template saved')
      setIsCustom(true)
      await loadTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    if (!confirm('Reset this template to the global default?')) return
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch(
        `/api/admin/restaurants/${restaurantId}/email-templates/${activeTab}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reset: true }),
        }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Reset failed')
      setSubject(json.template.subject)
      setHtmlBody(json.template.html_body)
      setIsCustom(false)
      setMessage('Reset to global default')
      await loadTemplates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setSaving(false)
    }
  }

  async function handlePreview() {
    setError(null)
    try {
      const res = await fetch(
        `/api/admin/restaurants/${restaurantId}/email-templates/${activeTab}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'preview', subject, html_body: htmlBody }),
        }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Preview failed')
      setPreviewSubject(json.subject)
      setPreviewHtml(json.html)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed')
    }
  }

  async function handleSendTest() {
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch(
        `/api/admin/restaurants/${restaurantId}/email-templates/${activeTab}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'test', subject, html_body: htmlBody }),
        }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Send failed')
      setMessage(`Test email sent to ${json.to}`)
      setPreviewSubject(json.subject)
      setPreviewHtml(json.html)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-slate-400">Loading email templates...</p>
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/restaurants/${restaurantId}`}
        className="text-sm text-violet-400"
      >
        ← Back to {restaurantName}
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">Email Templates</h1>
        <p className="text-slate-400 text-sm mt-1">{restaurantName}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {EMAIL_TEMPLATE_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setActiveTab(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === type
                ? 'bg-violet-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {EMAIL_TEMPLATE_LABELS[type]}
          </button>
        ))}
      </div>

      {!isCustom && (
        <p className="text-sm text-amber-400 bg-amber-950/40 border border-amber-900/50 rounded-lg px-4 py-2">
          Using global default — save to create a custom template for this restaurant.
        </p>
      )}

      {message && <p className="text-sm text-emerald-400">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <div>
            <label className="text-xs text-slate-400">Subject line</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400">HTML body</label>
            <textarea
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              rows={24}
              spellCheck={false}
              className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-emerald-100 text-xs font-mono leading-relaxed"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePreview}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-600"
            >
              Preview
            </button>
            <button
              type="button"
              onClick={handleSendTest}
              disabled={saving}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-600 disabled:opacity-50"
            >
              Send test email
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save template'}
            </button>
            {isCustom && (
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="px-4 py-2 bg-red-900/60 text-red-200 rounded-lg text-sm disabled:opacity-50"
              >
                Reset to default
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Available variables</h3>
            <ul className="space-y-1">
              {EMAIL_TEMPLATE_VARIABLES[activeTab].map((variable) => (
                <li key={variable} className="text-xs font-mono text-violet-300">
                  {variable.startsWith('items') ? '{{#each items}}...{{/each}}' : `{{${variable}}}`}
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-500 mt-3">
              Use {'{{#if variable}}...{{/if}}'} for optional sections.
            </p>
          </div>

          {previewHtml && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-2">Preview</h3>
              {previewSubject && (
                <p className="text-xs text-slate-400 mb-3 truncate">
                  Subject: {previewSubject}
                </p>
              )}
              <div className="bg-white rounded-lg overflow-hidden max-h-[480px] overflow-y-auto">
                <iframe
                  title="Email preview"
                  srcDoc={previewHtml}
                  className="w-full min-h-[400px] border-0"
                  sandbox=""
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
