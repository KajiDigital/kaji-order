'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Address = {
  id: string
  address: string
  postcode: string
}

export function AccountDetailsForm({
  slug,
  name: initialName,
  email,
  phone: initialPhone,
  addresses: initialAddresses,
  primary,
}: {
  slug: string
  name: string
  email: string
  phone: string | null
  addresses: Address[]
  primary: string
}) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone ?? '')
  const [addresses, setAddresses] = useState(initialAddresses)
  const [newAddress, setNewAddress] = useState('')
  const [newPostcode, setNewPostcode] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAddress, setEditAddress] = useState('')
  const [editPostcode, setEditPostcode] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0)

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    const res = await fetch('/api/customer/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      setError(data.error ?? 'Could not save details')
      return
    }
    setMessage('Name saved')
    router.refresh()
  }

  async function addAddress(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    const res = await fetch('/api/customer/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: newAddress, postcode: newPostcode }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Could not save address')
      return
    }
    setAddresses((current) => [data.address, ...current])
    setNewAddress('')
    setNewPostcode('')
    setMessage('Address saved')
    router.refresh()
  }

  async function saveAddress(id: string) {
    setError('')
    const res = await fetch(`/api/customer/addresses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: editAddress, postcode: editPostcode }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Could not update address')
      return
    }
    setAddresses((current) =>
      current.map((row) => (row.id === id ? data.address : row))
    )
    setEditingId(null)
    setMessage('Address updated')
    router.refresh()
  }

  async function removeAddress(id: string) {
    const res = await fetch(`/api/customer/addresses/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Could not delete address')
      return
    }
    setAddresses((current) => current.filter((row) => row.id !== id))
    setMessage('Address removed')
    router.refresh()
  }

  async function deleteAccount() {
    if (deleteStep === 0) {
      setDeleteStep(1)
      setError('')
      return
    }
    if (deleteStep === 1) {
      setDeleteStep(2)
      return
    }
    setDeleting(true)
    const res = await fetch('/api/customer/account', { method: 'DELETE' })
    setDeleting(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Could not delete account')
      setDeleteStep(0)
      return
    }
    router.push(`/${slug}`)
    router.refresh()
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200/80">
        <h1 className="text-xl font-bold text-stone-900">Account details</h1>
        <p className="mt-1 text-sm text-stone-500">
          Change the name used on orders, and the delivery address we save for next time.
        </p>
        <form onSubmit={saveProfile} className="mt-5 space-y-3">
          <label className="block text-sm">
            <span className="text-stone-500">Name</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border bg-white px-4 py-3 text-stone-900"
            />
          </label>
          <label className="block text-sm">
            <span className="text-stone-500">Email</span>
            <input
              value={email}
              disabled
              className="mt-1 w-full rounded-xl border bg-stone-50 px-4 py-3 text-stone-500"
            />
          </label>
          <label className="block text-sm">
            <span className="text-stone-500">Phone</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-xl border bg-white px-4 py-3 text-stone-900"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl py-3 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: primary }}
          >
            {saving ? 'Saving...' : 'Save name'}
          </button>
        </form>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200/80">
        <h2 className="font-semibold text-stone-900">Delivery addresses</h2>
        <p className="mt-1 text-sm text-stone-500">Save up to 3 addresses for faster checkout.</p>

        <div className="mt-4 space-y-3">
          {addresses.length === 0 && (
            <p className="text-sm text-stone-500">No saved address yet.</p>
          )}
          {addresses.map((row) => (
            <div key={row.id} className="rounded-2xl bg-stone-50 p-3">
              {editingId === row.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    rows={2}
                    className="w-full rounded-xl border bg-white px-3 py-2 text-sm text-stone-900"
                  />
                  <input
                    value={editPostcode}
                    onChange={(e) => setEditPostcode(e.target.value)}
                    className="w-full rounded-xl border bg-white px-3 py-2 text-sm uppercase text-stone-900"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void saveAddress(row.id)}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                      style={{ backgroundColor: primary }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-full px-3 py-1.5 text-xs text-stone-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-stone-800">{row.address}</p>
                  <p className="text-sm text-stone-500">{row.postcode}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(row.id)
                        setEditAddress(row.address)
                        setEditPostcode(row.postcode)
                      }}
                      className="text-xs font-medium"
                      style={{ color: primary }}
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeAddress(row.id)}
                      className="text-xs text-rose-600"
                    >
                      Remove
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {addresses.length < 3 && (
          <form onSubmit={addAddress} className="mt-4 space-y-2">
            <textarea
              required
              placeholder="Street address"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              rows={2}
              className="w-full rounded-xl border bg-white px-4 py-3 text-stone-900"
            />
            <input
              required
              placeholder="Postcode"
              value={newPostcode}
              onChange={(e) => setNewPostcode(e.target.value)}
              className="w-full rounded-xl border bg-white px-4 py-3 uppercase text-stone-900 placeholder:normal-case"
            />
            <button
              type="submit"
              className="w-full rounded-2xl py-3 text-sm font-semibold text-white"
              style={{ backgroundColor: primary }}
            >
              Save address
            </button>
          </form>
        )}
      </section>

      {(message || error) && (
        <p className={`text-sm ${error ? 'text-rose-600' : 'text-emerald-700'}`}>
          {error || message}
        </p>
      )}

      <div className="space-y-3 pb-6">
        {deleteStep === 0 && (
          <button
            type="button"
            onClick={() => void deleteAccount()}
            className="w-full cursor-pointer rounded-2xl px-4 py-3 text-sm text-rose-600"
          >
            Delete my account
          </button>
        )}

        {deleteStep === 1 && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-medium text-rose-950">Delete this account?</p>
            <p className="mt-1 text-sm text-rose-800">
              You will be signed out. Past orders stay with the restaurant, but your login
              and personal details are removed.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteStep(0)}
                className="flex-1 cursor-pointer rounded-2xl bg-white py-2.5 text-sm font-medium text-stone-700 ring-1 ring-rose-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void deleteAccount()}
                className="flex-1 cursor-pointer rounded-2xl bg-rose-600 py-2.5 text-sm font-semibold text-white"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {deleteStep === 2 && (
          <div className="rounded-3xl border border-rose-300 bg-rose-50 p-4">
            <p className="text-sm font-medium text-rose-950">Are you sure? This cannot be undone.</p>
            <p className="mt-1 text-sm text-rose-800">
              Press delete again to permanently remove your account.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteStep(0)}
                className="flex-1 cursor-pointer rounded-2xl bg-white py-2.5 text-sm font-medium text-stone-700 ring-1 ring-rose-200"
              >
                Keep my account
              </button>
              <button
                type="button"
                onClick={() => void deleteAccount()}
                disabled={deleting}
                className="flex-1 cursor-pointer rounded-2xl bg-rose-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, delete permanently'}
              </button>
            </div>
          </div>
        )}

        <Link href={`/${slug}/privacy`} className="block text-center text-xs text-stone-400 underline">
          Privacy
        </Link>
      </div>
    </div>
  )
}
