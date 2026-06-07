export const dynamic = 'force-dynamic'

import { getSession } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'
import { SettingsClient } from '@/app/components/settings/SettingsClient'

export default async function SettingsPage() {
  const session = await getSession()
  if (!session) return null

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.restaurantId },
  })

  if (!restaurant) return null

  return <SettingsClient initial={restaurant} />
}
