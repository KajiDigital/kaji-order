'use client'

import { useEffect, useState } from 'react'
import { PublicMenuClient } from '@/app/components/public/PublicMenuClient'
import type { Category, MenuPromotion, Restaurant } from '@/app/components/public/menu-types'

type PreviewPayload = {
  restaurant: Restaurant
  categories: Category[]
  promotions: MenuPromotion[]
  promotionBannerMessages: string[]
}

type Props = {
  device: 'mobile' | 'desktop'
  showMenuImages?: boolean
  collectionEnabled?: boolean
  deliveryEnabled?: boolean
}

export function MenuPreview({
  device,
  showMenuImages,
  collectionEnabled,
  deliveryEnabled,
}: Props) {
  const [data, setData] = useState<PreviewPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch('/api/menu/preview')
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Failed to load preview')
        if (!cancelled) {
          setData(json)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load preview')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="menu-builder-preview-status">
        <p style={{ color: 'var(--mb-muted)' }}>Loading preview…</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="menu-builder-preview-status">
        <p style={{ color: '#dc2626' }}>{error ?? 'Preview unavailable'}</p>
      </div>
    )
  }

  return (
    <div className="menu-builder-preview-viewport" data-device={device}>
      <div className="menu-builder-preview-frame">
        {device === 'mobile' && <div className="menu-builder-preview-notch" aria-hidden />}
        <div className="menu-builder-preview-scroll">
          <PublicMenuClient
            restaurant={{
              ...data.restaurant,
              show_menu_images: showMenuImages ?? data.restaurant.show_menu_images,
              collection_enabled: collectionEnabled ?? data.restaurant.collection_enabled,
              delivery_enabled: deliveryEnabled ?? data.restaurant.delivery_enabled,
            }}
            categories={data.categories}
            promotions={data.promotions}
            promotionBannerMessages={data.promotionBannerMessages}
            isPreview
            previewLayout={device}
            showMenuImagesOverride={showMenuImages}
          />
        </div>
      </div>
    </div>
  )
}
