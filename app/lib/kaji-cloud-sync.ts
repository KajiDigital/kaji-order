import prisma from '@/app/lib/prisma'

export type KajiCloudMenuSyncEvent = {
  change_type: string
  entity_id?: string | null
  data: Record<string, unknown>
}

/**
 * Queue menu changes for kaji-cloud → kaji-pos when restaurant is integrated.
 * Stub: logs payload until kaji-cloud OOS inbound API is available.
 */
export async function queueKajiCloudMenuSync(
  restaurantId: string,
  event: KajiCloudMenuSyncEvent
): Promise<void> {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { menu_source: true, kaji_cloud_id: true, slug: true },
  })

  if (!restaurant) return
  if (restaurant.menu_source !== 'kaji_sync' || !restaurant.kaji_cloud_id) return

  const baseUrl = process.env.KAJI_CLOUD_API_URL
  const apiKey = process.env.KAJI_CLOUD_API_KEY

  const payload = {
    restaurant_id: restaurant.kaji_cloud_id,
    oos_restaurant_id: restaurantId,
    ...event,
  }

  if (!baseUrl) {
    if (process.env.NODE_ENV === 'development') {
      console.info('[kaji-cloud-sync] skipped (KAJI_CLOUD_API_URL unset)', payload)
    }
    return
  }

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/oos/menu/changes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error('[kaji-cloud-sync] failed', res.status, text, payload)
    }
  } catch (error) {
    console.error('[kaji-cloud-sync] error', error, payload)
  }
}
