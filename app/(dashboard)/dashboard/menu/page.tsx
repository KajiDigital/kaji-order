export const dynamic = 'force-dynamic'

import { getSession } from '@/app/lib/auth'
import { MenuBuilder } from '@/app/components/menu/MenuBuilder'

export default async function MenuPage() {
  const session = await getSession()

  return (
    <MenuBuilder
      restaurantName={session?.restaurant.name ?? 'Your restaurant'}
      restaurantSlug={session?.restaurant.slug ?? ''}
    />
  )
}
