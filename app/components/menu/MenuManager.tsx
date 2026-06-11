'use client'

import { useEffect, useState } from 'react'
import { formatPence } from '@/app/lib/utils'

type Modifier = { id?: string; name: string; price_delta_pence?: number; price?: string; is_default?: boolean }
type ModifierGroup = {
  id?: string
  name: string
  required?: boolean
  min_select?: number
  max_select?: number
  modifiers?: Modifier[]
}
type Product = {
  id: string
  name: string
  description?: string | null
  price_pence: number
  image_url?: string | null
  is_available: boolean
  is_bundle?: boolean
  modifier_groups?: ModifierGroup[]
}
type Category = {
  id: string
  name: string
  color: string
  is_active: boolean
  items: Product[]
}

export function MenuManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const selected = categories.find((c) => c.id === selectedId) ?? categories[0]

  async function load() {
    const res = await fetch('/api/menu/categories')
    const data = await res.json()
    setCategories(data.categories ?? [])
    if (!selectedId && data.categories?.[0]) setSelectedId(data.categories[0].id)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function addCategory() {
    const name = prompt('Category name')
    if (!name) return
    await fetch('/api/menu/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    load()
  }

  async function toggleCategory(id: string, is_active: boolean) {
    await fetch(`/api/menu/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !is_active }),
    })
    load()
  }

  async function deleteCategory(id: string) {
    if (!confirm('Delete category and all products?')) return
    await fetch(`/api/menu/categories/${id}`, { method: 'DELETE' })
    load()
  }

  async function toggleProduct(id: string, is_available: boolean) {
    await fetch(`/api/menu/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_available: !is_available }),
    })
    load()
  }

  async function deleteProduct(id: string) {
    if (!confirm('Delete product?')) return
    await fetch(`/api/menu/products/${id}`, { method: 'DELETE' })
    load()
  }

  if (loading) return <p className="text-slate-400">Loading menu...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-4">Menu</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 min-h-[500px]">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-white">Categories</h2>
            <button type="button" onClick={addCategory} className="text-violet-400 text-sm">+ Add</button>
          </div>
          <ul className="space-y-1">
            {categories.map((cat) => (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${
                    selected?.id === cat.id ? 'bg-violet-600/20 text-white' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                  {!cat.is_active && <span className="text-xs text-slate-600">(off)</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          {selected ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-white">{selected.name}</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => toggleCategory(selected.id, selected.is_active)}
                    className="text-sm text-slate-400"
                  >
                    {selected.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button type="button" onClick={() => deleteCategory(selected.id)} className="text-sm text-red-400">
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(null)
                      setShowProductForm(true)
                    }}
                    className="text-sm bg-violet-600 text-white px-3 py-1 rounded-lg"
                  >
                    + Product
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {selected.items.map((product) => (
                  <div key={product.id} className="flex items-center justify-between bg-slate-800 rounded-lg p-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-medium">{product.name}</p>
                        {product.is_bundle && (
                          <span className="text-[10px] uppercase tracking-wide bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                            Set meal
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-violet-400">{formatPence(product.price_pence)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProduct(product)
                          setShowProductForm(true)
                        }}
                        className="text-xs text-slate-400"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleProduct(product.id, product.is_available)}
                        className="text-xs text-slate-400"
                      >
                        {product.is_available ? 'Hide' : 'Show'}
                      </button>
                      <button type="button" onClick={() => deleteProduct(product.id)} className="text-xs text-red-400">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {selected.items.length === 0 && (
                  <p className="text-slate-500 text-sm">No products yet.</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-slate-500">Add a category to get started.</p>
          )}
        </div>
      </div>

      {showProductForm && selected && (
        <ProductForm
          categoryId={selected.id}
          product={editingProduct}
          onClose={() => {
            setShowProductForm(false)
            setEditingProduct(null)
            load()
          }}
        />
      )}
    </div>
  )
}

function ProductForm({
  categoryId,
  product,
  onClose,
}: {
  categoryId: string
  product: Product | null
  onClose: () => void
}) {
  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(product ? (product.price_pence / 100).toFixed(2) : '')
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '')
  const [groups, setGroups] = useState<ModifierGroup[]>(product?.modifier_groups ?? [])
  const [isBundle, setIsBundle] = useState(product?.is_bundle ?? false)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const payload = {
      category_id: categoryId,
      name,
      description,
      price,
      is_bundle: isBundle,
      image_url: imageUrl || null,
      modifier_groups: groups.map((g) => ({
        name: g.name,
        required: g.required,
        min_select: g.min_select,
        max_select: g.max_select,
        modifiers: (g.modifiers ?? []).map((m) => ({
          name: m.name,
          price: m.price ?? String((m.price_delta_pence ?? 0) / 100),
          is_default: m.is_default,
        })),
      })),
    }

    if (product) {
      await fetch(`/api/menu/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch('/api/menu/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <h3 className="text-lg font-bold text-white">{product ? 'Edit product' : 'Add product'}</h3>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white" />
        <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white" rows={2} />
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={isBundle} onChange={(e) => setIsBundle(e.target.checked)} />
          This is a set meal / bundle
        </label>
        <label className="block text-sm text-slate-400">
          {isBundle ? 'Bundle price (includes all choices)' : 'Price (£)'}
          <input
            placeholder={isBundle ? '14.95' : '9.99'}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
          />
        </label>
        <input placeholder="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white" />

        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-slate-400">Modifier groups</span>
            <button
              type="button"
              onClick={() => setGroups([...groups, { name: 'Options', required: false, max_select: 1, modifiers: [] }])}
              className="text-xs text-violet-400"
            >
              + Group
            </button>
          </div>
          <p className="text-xs text-amber-200/80 mb-3 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
            💡 Tip: Use modifier groups to create bundle meals and set menus. Set a fixed item price
            and add &apos;Select Starter&apos;, &apos;Select Main&apos; groups.
          </p>
          {groups.map((g, gi) => (
            <div key={gi} className="bg-slate-800 rounded-lg p-3 mb-2 space-y-2">
              <input value={g.name} onChange={(e) => { const ng = [...groups]; ng[gi] = { ...g, name: e.target.value }; setGroups(ng) }} className="w-full bg-slate-700 rounded px-2 py-1 text-white text-sm" placeholder="Group name" />
              <label className="flex items-center gap-2 text-xs text-slate-400">
                <input type="checkbox" checked={g.required} onChange={(e) => { const ng = [...groups]; ng[gi] = { ...g, required: e.target.checked }; setGroups(ng) }} />
                Required
              </label>
              <button
                type="button"
                onClick={() => {
                  const ng = [...groups]
                  ng[gi].modifiers = [...(g.modifiers ?? []), { name: 'Option', price: '0' }]
                  setGroups(ng)
                }}
                className="text-xs text-violet-400"
              >
                + Modifier
              </button>
              {(g.modifiers ?? []).map((m, mi) => (
                <div key={mi} className="flex gap-2">
                  <input value={m.name} onChange={(e) => { const ng = [...groups]; const mods = [...(g.modifiers ?? [])]; mods[mi] = { ...m, name: e.target.value }; ng[gi] = { ...g, modifiers: mods }; setGroups(ng) }} className="flex-1 bg-slate-700 rounded px-2 py-1 text-white text-sm" />
                  <input value={m.price ?? ''} onChange={(e) => { const ng = [...groups]; const mods = [...(g.modifiers ?? [])]; mods[mi] = { ...m, price: e.target.value }; ng[gi] = { ...g, modifiers: mods }; setGroups(ng) }} className="w-20 bg-slate-700 rounded px-2 py-1 text-white text-sm" placeholder="£" />
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 text-slate-400">Cancel</button>
          <button type="button" onClick={save} disabled={saving || !name} className="flex-1 py-2 bg-violet-600 text-white rounded-lg disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
