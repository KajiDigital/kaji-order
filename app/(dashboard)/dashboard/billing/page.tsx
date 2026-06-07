export const dynamic = 'force-dynamic'

import { getSession } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'
import { formatPence } from '@/app/lib/utils'
import { ConnectStripeButton } from '@/app/components/billing/ConnectStripeButton'

export default async function BillingPage() {
  const session = await getSession()
  if (!session) return null

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.restaurantId },
  })

  const month = new Date().toISOString().slice(0, 7)
  const commission = await prisma.commissionRecord.aggregate({
    where: { restaurant_id: session.restaurantId, period_month: month },
    _sum: { commission_pence: true, total_revenue_pence: true },
    _count: true,
  })

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-white">Billing</h1>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="font-semibold text-white mb-2">Current plan</h2>
        <p className="text-violet-400 text-lg">{restaurant?.pricing_plan}</p>
        <p className="text-sm text-slate-400 mt-1">
          Your agreed rate: {restaurant?.commission_pct}%
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="font-semibold text-white mb-2">This month</h2>
        <p className="text-slate-300">Orders: {commission._count}</p>
        <p className="text-slate-300">Revenue: {formatPence(commission._sum.total_revenue_pence ?? 0)}</p>
        <p className="text-slate-300">Commission: {formatPence(commission._sum.commission_pence ?? 0)}</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="font-semibold text-white mb-2">Stripe Connect</h2>
        {restaurant?.stripe_account_id ? (
          <p className="text-emerald-400 text-sm">Connected: {restaurant.stripe_account_id}</p>
        ) : (
          <>
            <p className="text-slate-400 text-sm mb-4">Connect Stripe to accept card payments.</p>
            <ConnectStripeButton />
          </>
        )}
      </div>
    </div>
  )
}
