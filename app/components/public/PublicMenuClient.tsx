'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { formatPence } from '@/app/lib/utils'
import {
  type BasketItem,
  type BasketSelection,
  basketItemCount,
  basketSubtotal,
  clearBasket,
  getBasket,
  saveBasket,
} from '@/app/lib/basket'
import { CartPanel } from './CartPanel'
import { ProductModal } from './ProductModal'
import { PromotionsBanner } from './PromotionsBanner'
import type { Category, MenuPromotion, Product, Restaurant } from './menu-types'
import { getFontClass } from '@/app/lib/branding'

function PlaceholderImage({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-stone-100 text-stone-300 ${className ?? ''}`}>
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  )
}

function PromoBadge({ promo }: { promo: MenuPromotion }) {
  const label =
    promo.badge_text ??
    (promo.promo_type === 'HAPPY_HOUR' && promo.time_from && promo.time_until
      ? `Happy Hour ${promo.time_from.slice(0, 5)}-${promo.time_until.slice(0, 5)}`
      : promo.name)

  return (
    <span
      className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
      style={{ backgroundColor: promo.badge_color ?? '#64748b' }}
    >
      {label}
    </span>
  )
}

function promosForCategory(promotions: MenuPromotion[], categoryId: string) {
  return promotions.filter(
    (p) =>
      p.applies_to === 'order' ||
      (p.applies_to === 'category' && p.applicable_ids?.includes(categoryId))
  )
}

function promosForItem(promotions: MenuPromotion[], itemId: string, categoryId: string) {
  return promotions.filter(
    (p) =>
      (p.applies_to === 'items' && p.applicable_ids?.includes(itemId)) ||
      (p.applies_to === 'category' && p.applicable_ids?.includes(categoryId))
  )
}

function AddButton({
  primary,
  onClick,
  disabled,
}: {
  primary: string
  onClick: (e: React.MouseEvent) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg font-bold text-white shadow-sm transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
      style={{ backgroundColor: disabled ? '#a8a29e' : primary }}
      aria-label="Add to cart"
    >
      +
    </button>
  )
}

function formatSetMealChoices(groups: Product['combo_groups']): string {
  const labels = groups.map((g) => g.name.replace(/^select\s+(your\s+)?/i, '').trim())
  return labels.join(' + ')
}

function isSetMeal(product: Product): boolean {
  return Boolean(product.is_bundle && product.combo_groups.length >= 1)
}

function hasCustomisation(product: Product): boolean {
  return product.option_groups.length > 0 || product.combo_groups.length > 0
}

function MenuItemRow({
  product,
  primary,
  recommended,
  promoBadges,
  canOrder,
  onAdd,
  onOpen,
}: {
  product: Product
  primary: string
  recommended: boolean
  promoBadges: MenuPromotion[]
  canOrder: boolean
  onAdd: () => void
  onOpen: () => void
}) {
  const unavailable = !product.available
  const orderingBlocked = !canOrder || unavailable
  const setMeal = isSetMeal(product)

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation()
    if (orderingBlocked) return
    if (hasCustomisation(product)) {
      onOpen()
    } else {
      onAdd()
    }
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`relative flex w-full gap-3 rounded-xl border bg-white text-left shadow-sm transition-shadow hover:shadow-md ${
        setMeal
          ? 'border-2 border-amber-200 bg-amber-50/40 p-4'
          : 'border-stone-200 p-3'
      }`}
    >
      {product.image_url ? (
        <img
          src={product.image_url}
          alt=""
          className="h-20 w-20 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <PlaceholderImage className="h-20 w-20 shrink-0 rounded-lg" />
      )}

      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-bold text-stone-900">{product.name}</p>
          {setMeal && (
            <span className="inline-flex rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              Set meal
            </span>
          )}
          {recommended && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
              ★ Recommended
            </span>
          )}
          {promoBadges.map((p) => (
            <PromoBadge key={p.id} promo={p} />
          ))}
        </div>
        {setMeal && (
          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
            Build your meal
          </p>
        )}
        {setMeal && (
          <p className="mt-0.5 text-xs text-amber-800/80">
            Choose: {formatSetMealChoices(product.combo_groups)}
          </p>
        )}
        {product.description && (
          <p className="mt-0.5 line-clamp-2 text-sm text-stone-500">{product.description}</p>
        )}
        <p className="mt-1.5 text-sm font-bold" style={{ color: primary }}>
          {formatPence(product.base_price)}
        </p>
      </div>

      <AddButton primary={primary} onClick={handleAdd} disabled={orderingBlocked} />

      {unavailable && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/75">
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            Unavailable
          </span>
        </div>
      )}
    </button>
  )
}

export function PublicMenuClient({
  restaurant,
  categories,
  promotions = [],
  promotionBannerMessages = [],
}: {
  restaurant: Restaurant
  categories: Category[]
  promotions?: MenuPromotion[]
  promotionBannerMessages?: string[]
}) {
  const primary = restaurant.primary_color
  const fontClass = getFontClass(restaurant.font_choice)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [basket, setBasket] = useState<BasketItem[]>([])
  const [modalProduct, setModalProduct] = useState<Product | null>(null)
  const [mobileCartOpen, setMobileCartOpen] = useState(false)
  const [orderType, setOrderType] = useState<'collection' | 'delivery'>('collection')
  const carouselRef = useRef<HTMLDivElement>(null)

  const allItems = useMemo(
    () => categories.flatMap((c) => c.items),
    [categories]
  )

  const recommendedIds = useMemo(
    () => new Set(allItems.filter((i) => i.featured).map((i) => i.id)),
    [allItems]
  )

  const recommendedItems = useMemo(
    () => (allItems.some((i) => i.featured) ? allItems.filter((i) => i.featured).slice(0, 6) : allItems.slice(0, 6)),
    [allItems]
  )

  const orderPromos = useMemo(
    () => promotions.filter((p) => p.applies_to === 'order'),
    [promotions]
  )

  const itemCategoryMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const cat of categories) {
      for (const item of cat.items) {
        map.set(item.id, cat.id)
      }
    }
    return map
  }, [categories])

  useEffect(() => {
    document.documentElement.style.setProperty('--primary', primary)
    document.documentElement.style.setProperty('--secondary', restaurant.secondary_color)
    return () => {
      document.documentElement.style.removeProperty('--primary')
      document.documentElement.style.removeProperty('--secondary')
    }
  }, [primary, restaurant.secondary_color])

  useEffect(() => {
    const stored = getBasket(restaurant.slug)
    if (stored?.items) setBasket(stored.items)
  }, [restaurant.slug])

  useEffect(() => {
    if (basket.length > 0) {
      saveBasket(restaurant.slug, {
        items: basket,
        restaurantSlug: restaurant.slug,
        updatedAt: new Date().toISOString(),
      })
    }
  }, [basket, restaurant.slug])

  const count = basketItemCount(basket)
  const subtotal = basketSubtotal(basket)

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase()
    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((item) => {
          if (activeCategory !== 'all' && cat.id !== activeCategory) return false
          if (!q) return true
          return (
            item.name.toLowerCase().includes(q) ||
            (item.description?.toLowerCase().includes(q) ?? false)
          )
        }),
      }))
      .filter((cat) => cat.items.length > 0)
  }, [categories, activeCategory, search])

  function persistBasket(items: BasketItem[]) {
    setBasket(items)
    if (items.length === 0) clearBasket(restaurant.slug)
  }

  function addItemDirect(
    product: Product,
    qty: number,
    selections: BasketSelection[],
    notes: string,
    pricing: { options_price: number; total_price: number },
    categoryId?: string
  ) {
    if (!canOrder) return
    const item: BasketItem = {
      id: `${product.id}-${Date.now()}`,
      menuItemId: product.id,
      categoryId: categoryId ?? itemCategoryMap.get(product.id),
      name: product.name,
      base_price: product.base_price,
      quantity: qty,
      selections,
      options_price: pricing.options_price,
      total_price: pricing.total_price,
      notes: notes || undefined,
    }
    persistBasket([...basket, item])
  }

  function openProduct(product: Product) {
    setModalProduct(product)
  }

  function updateQty(id: string, qty: number) {
    if (qty < 1) {
      persistBasket(basket.filter((i) => i.id !== id))
      return
    }
    persistBasket(
      basket.map((i) => {
        if (i.id !== id) return i
        const unit = i.total_price / i.quantity
        return { ...i, quantity: qty, total_price: unit * qty }
      })
    )
  }

  function removeItem(id: string) {
    persistBasket(basket.filter((i) => i.id !== id))
  }

  function scrollCarousel(dir: -1 | 1) {
    carouselRef.current?.scrollBy({ left: dir * 220, behavior: 'smooth' })
  }

  const canOrder = restaurant.canOrder
  const isLiveOpen = restaurant.isLiveOpen
  const isPreorderMode = restaurant.isPreorderMode
  const closedNotice = restaurant.closedNotice ?? {
    title: "We're currently closed",
    description:
      'You can browse our menu below. Please come back during opening hours to place an order.',
    badge: 'Browse only',
  }

  const statusBadge = isLiveOpen
    ? { label: 'Open', className: 'bg-emerald-500' }
    : isPreorderMode
      ? { label: 'Pre-order', className: 'bg-amber-500' }
      : { label: 'Closed', className: 'bg-stone-600' }

  const cartPanelProps = {
    slug: restaurant.slug,
    items: basket,
    primary,
    minOrderPence: restaurant.min_order_pence,
    orderType,
    onOrderTypeChange: setOrderType,
    onUpdateQty: updateQty,
    onRemove: removeItem,
  }

  return (
    <div className={`min-h-screen bg-stone-50 pb-24 lg:pb-8 ${fontClass}`}>
      {/* Banner */}
      <div className="relative h-44 sm:h-52 lg:h-56">
        {restaurant.banner_url ? (
          <img
            src={restaurant.banner_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background: `linear-gradient(135deg, ${primary} 0%, ${primary}cc 50%, ${primary}99 100%)`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-12 sm:px-6">
          <div className="mx-auto flex max-w-7xl items-end gap-4">
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt=""
                className="h-16 w-16 shrink-0 rounded-full border-4 border-white object-cover shadow-lg sm:h-20 sm:w-20"
              />
            ) : (
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-white text-xl font-bold text-white shadow-lg sm:h-20 sm:w-20"
                style={{ backgroundColor: primary }}
              >
                {restaurant.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1 pb-1">
              <h1 className="text-2xl font-bold text-white drop-shadow sm:text-3xl">
                {restaurant.name}
              </h1>
              {restaurant.description && (
                <p className="mt-0.5 line-clamp-2 text-sm text-white/90 drop-shadow">
                  {restaurant.description}
                </p>
              )}
            </div>
            <span
              className={`mb-1 shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-white shadow ${statusBadge.className}`}
            >
              {statusBadge.label}
            </span>
          </div>
        </div>
      </div>

      <PromotionsBanner messages={promotionBannerMessages} />

      {orderPromos.length > 0 && promotionBannerMessages.length === 0 && (
        <div className="border-b border-stone-200 bg-white px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-wrap gap-2">
            {orderPromos.map((p) => (
              <PromoBadge key={p.id} promo={p} />
            ))}
          </div>
        </div>
      )}

      {/* Info bar */}
      <div className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
          {restaurant.phone && (
            <a
              href={`tel:${restaurant.phone}`}
              className="flex items-center gap-2 text-sm text-stone-700 hover:text-stone-900"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {restaurant.phone}
            </a>
          )}
          {restaurant.email && (
            <a
              href={`mailto:${restaurant.email}`}
              className="flex items-center gap-2 text-sm text-stone-700 hover:text-stone-900"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="truncate">{restaurant.email}</span>
            </a>
          )}
          {restaurant.phone && (
            <a
              href={`tel:${restaurant.phone}`}
              className="ml-auto flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm"
              style={{ backgroundColor: primary }}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call Now
            </a>
          )}
        </div>
      </div>

      {!isLiveOpen && (
        <div className="border-b border-stone-200 bg-white px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-7xl items-start gap-4 rounded-xl border border-stone-200 bg-stone-50 p-4 shadow-sm sm:items-center">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: primary }}
              aria-hidden
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-stone-900">{closedNotice.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-stone-600">
                {closedNotice.description}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-stone-600">
              {closedNotice.badge ?? (canOrder ? 'Pre-order' : 'Browse only')}
            </span>
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        {/* Desktop category sidebar */}
        <aside className="hidden w-[250px] shrink-0 lg:block">
          <nav className="sticky top-4 space-y-1 rounded-xl border border-stone-200 bg-white p-2 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                activeCategory === 'all' ? 'text-white' : 'text-stone-700 hover:bg-stone-50'
              }`}
              style={activeCategory === 'all' ? { backgroundColor: primary } : undefined}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-stone-400" />
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  activeCategory === cat.id ? 'text-white' : 'text-stone-700 hover:bg-stone-50'
                }`}
                style={activeCategory === cat.id ? { backgroundColor: primary } : undefined}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                {cat.name}
              </button>
            ))}
          </nav>
        </aside>

        {/* Center content */}
        <main className="min-w-0 flex-1">
          {/* Recommended carousel */}
          {recommendedItems.length > 0 && !search && (
            <section className="mb-6">
              <h2 className="mb-3 text-lg font-bold text-stone-900">Recommended Meals</h2>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => scrollCarousel(-1)}
                  className="absolute -left-2 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white shadow sm:flex"
                  aria-label="Scroll left"
                >
                  ‹
                </button>
                <div
                  ref={carouselRef}
                  className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide"
                  style={{ scrollbarWidth: 'none' }}
                >
                  {recommendedItems.map((product) => (
                    <div
                      key={product.id}
                      className="relative w-36 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm sm:w-40"
                    >
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt=""
                          className="h-28 w-full object-cover"
                        />
                      ) : (
                        <PlaceholderImage className="h-28 w-full" />
                      )}
                      <div className="p-2.5">
                        <p className="truncate text-sm font-bold text-stone-900">{product.name}</p>
                        <p className="text-sm font-semibold" style={{ color: primary }}>
                          {formatPence(product.base_price)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          canOrder &&
                          (hasCustomisation(product)
                            ? openProduct(product)
                            : product.available &&
                              addItemDirect(
                                product,
                                1,
                                [],
                                '',
                                { options_price: 0, total_price: product.base_price },
                                itemCategoryMap.get(product.id)
                              ))
                        }
                        disabled={!canOrder || !product.available}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold text-white shadow disabled:cursor-not-allowed disabled:opacity-40"
                        style={{
                          backgroundColor:
                            !canOrder || !product.available ? '#a8a29e' : primary,
                        }}
                      >
                        +
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => scrollCarousel(1)}
                  className="absolute -right-2 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white shadow sm:flex"
                  aria-label="Scroll right"
                >
                  ›
                </button>
              </div>
            </section>
          )}

          {/* Mobile category pills */}
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                activeCategory === 'all' ? 'text-white' : 'border border-stone-200 bg-white text-stone-700'
              }`}
              style={activeCategory === 'all' ? { backgroundColor: primary } : undefined}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium ${
                  activeCategory === cat.id ? 'text-white' : 'border border-stone-200 bg-white text-stone-700'
                }`}
                style={activeCategory === cat.id ? { backgroundColor: primary } : undefined}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: activeCategory === cat.id ? 'white' : cat.color }}
                />
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <svg
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder="Search meals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm focus:border-stone-400 focus:outline-none"
            />
          </div>

          {/* Menu list */}
          {filteredCategories.length === 0 ? (
            <p className="py-12 text-center text-stone-500">No items match your search.</p>
          ) : (
            filteredCategories.map((cat) => (
              <section key={cat.id} className="mb-8">
                {(activeCategory === 'all' || search) && (
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-stone-900">{cat.name}</h2>
                    {promosForCategory(promotions, cat.id)
                      .filter((p) => p.applies_to === 'category')
                      .map((p) => (
                        <PromoBadge key={p.id} promo={p} />
                      ))}
                  </div>
                )}
                <div className="space-y-3">
                  {cat.items.map((product) => (
                    <MenuItemRow
                      key={product.id}
                      product={product}
                      primary={primary}
                      recommended={recommendedIds.has(product.id)}
                      promoBadges={promosForItem(promotions, product.id, cat.id).filter(
                        (p) => p.applies_to === 'items'
                      )}
                      canOrder={canOrder}
                      onOpen={() => openProduct(product)}
                      onAdd={() =>
                        addItemDirect(product, 1, [], '', {
                          options_price: 0,
                          total_price: product.base_price,
                        }, cat.id)
                      }
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </main>

        {/* Desktop cart sidebar */}
        {canOrder && (
        <aside className="hidden w-[300px] shrink-0 lg:block">
          <div className="sticky top-4">
            <CartPanel {...cartPanelProps} />
          </div>
        </aside>
        )}
      </div>

      {/* Mobile floating cart */}
      {canOrder && count > 0 && (
        <button
          type="button"
          onClick={() => setMobileCartOpen(true)}
          className="fixed bottom-4 left-4 right-4 z-40 flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg lg:hidden"
          style={{ backgroundColor: primary }}
        >
          <span>🛒</span>
          <span>
            {count} {count === 1 ? 'item' : 'items'} · {formatPence(subtotal)}
          </span>
        </button>
      )}

      {/* Mobile cart drawer */}
      {canOrder && mobileCartOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileCartOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-stone-50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-stone-900">Your order</h2>
              <button
                type="button"
                onClick={() => setMobileCartOpen(false)}
                className="rounded-full p-1 text-stone-400 hover:bg-stone-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <CartPanel {...cartPanelProps} compact />
          </div>
        </div>
      )}

      {/* Product modal */}
      {modalProduct && (
        <ProductModal
          product={modalProduct}
          primary={primary}
          canOrder={canOrder && modalProduct.available}
          onClose={() => setModalProduct(null)}
          onAdd={(qty, selections, notes, pricing) => {
            addItemDirect(
              modalProduct,
              qty,
              selections,
              notes,
              pricing,
              itemCategoryMap.get(modalProduct.id)
            )
            setModalProduct(null)
          }}
        />
      )}

      {restaurant.show_powered_by && (
        <footer className="border-t border-stone-200 bg-white py-4 text-center">
          <a
            href="https://order.kajipos.co.uk"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-stone-400 transition-colors hover:text-stone-600"
          >
            Powered by Kaji Order 🌮
          </a>
        </footer>
      )}
    </div>
  )
}
