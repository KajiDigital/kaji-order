'use client'

import { formatPence } from '@/app/lib/utils'
import { MenuPlaceholderImage } from './MenuPlaceholderImage'
import { useHorizontalDragScroll } from './use-horizontal-drag-scroll'
import type { Product } from './menu-types'

type Props = {
  items: Product[]
  primary: string
  showMenuImages: boolean
  canOrder: boolean
  onAdd: (product: Product) => void
}

export function RecommendedMeals({
  items,
  primary,
  showMenuImages,
  canOrder,
  onAdd,
}: Props) {
  const drag = useHorizontalDragScroll()

  function scroll(dir: -1 | 1) {
    drag.ref.current?.scrollBy({ left: dir * 260, behavior: 'smooth' })
  }

  return (
    <section className="mb-6">
      <h2 className="mb-3 text-lg font-bold text-stone-900">Recommended Meals</h2>
      <div className="relative">
        <button
          type="button"
          onClick={() => scroll(-1)}
          className="absolute -left-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white text-lg shadow sm:flex"
          aria-label="Scroll left"
        >
          ‹
        </button>
        <div
          ref={drag.ref}
          className="no-scrollbar flex cursor-grab select-none gap-4 overflow-x-auto pb-2"
          onPointerDown={drag.onPointerDown}
          onPointerMove={drag.onPointerMove}
          onPointerUp={drag.onPointerUp}
          onPointerCancel={drag.onPointerCancel}
          onClickCapture={drag.onClickCapture}
        >
          {items.map((product) => (
            <RecommendedMealCard
              key={product.id}
              product={product}
              primary={primary}
              showMenuImages={showMenuImages}
              canOrder={canOrder}
              onAdd={() => onAdd(product)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => scroll(1)}
          className="absolute -right-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white text-lg shadow sm:flex"
          aria-label="Scroll right"
        >
          ›
        </button>
      </div>
    </section>
  )
}

function RecommendedMealCard({
  product,
  primary,
  showMenuImages,
  canOrder,
  onAdd,
}: {
  product: Product
  primary: string
  showMenuImages: boolean
  canOrder: boolean
  onAdd: () => void
}) {
  const blocked = !canOrder || !product.available

  return (
    <div className="relative flex w-36 shrink-0 flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm sm:w-40">
      {showMenuImages &&
        (product.image_url ? (
          <img src={product.image_url} alt="" className="h-20 w-full object-cover sm:h-24" />
        ) : (
          <MenuPlaceholderImage className="h-20 w-full sm:h-24" />
        ))}
      <div className={`flex flex-1 flex-col ${showMenuImages ? 'p-2.5' : 'p-3 pr-11'}`}>
        <p className="line-clamp-2 text-sm font-bold leading-snug text-stone-900">{product.name}</p>
        <p className="mt-1 text-sm font-bold" style={{ color: primary }}>
          {formatPence(product.base_price)}
        </p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        disabled={blocked}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold text-white shadow disabled:cursor-not-allowed disabled:opacity-40"
        style={{ backgroundColor: blocked ? '#a8a29e' : primary }}
      >
        +
      </button>
    </div>
  )
}
