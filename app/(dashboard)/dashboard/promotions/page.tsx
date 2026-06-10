export const dynamic = 'force-dynamic'

import { getSession } from '@/app/lib/auth'
import { PromotionsManager } from '@/app/components/promotions/PromotionsManager'

export default async function PromotionsPage() {
  const session = await getSession()
  if (!session) return null

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Promotions</h1>
      <PromotionsManager />
    </div>
  )
}
