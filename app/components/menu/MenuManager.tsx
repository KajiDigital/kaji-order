'use client'

import { useEffect, useState } from 'react'
import { formatPence } from '@/app/lib/utils'
import { ItemForm, type DbProduct } from './ItemForm'

type Product = DbProduct

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

  async function toggleProduct(id: string, available: boolean) {
    await fetch(`/api/menu/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ available: !available }),
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
            <button type="button" onClick={addCategory} className="text-violet-400 text-sm">
              + Add
            </button>
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
                        {product.featured && (
                          <span className="text-[10px] uppercase tracking-wide bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded">
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-violet-400">{formatPence(product.base_price)}</p>
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
                        onClick={() => toggleProduct(product.id, product.available)}
                        className="text-xs text-slate-400"
                      >
                        {product.available ? 'Hide' : 'Show'}
                      </button>
                      <button type="button" onClick={() => deleteProduct(product.id)} className="text-xs text-red-400">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {selected.items.length === 0 && <p className="text-slate-500 text-sm">No products yet.</p>}
              </div>
            </>
          ) : (
            <p className="text-slate-500">Add a category to get started.</p>
          )}
        </div>
      </div>

      {showProductForm && selected && (
        <ItemForm
          categoryId={selected.id}
          product={editingProduct}
          allCategories={categories}
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
