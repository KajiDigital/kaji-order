export const dynamic = 'force-dynamic'

import { getSession } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'
import { formatPence } from '@/app/lib/utils'
import { getStripe, stripeConfigured } from '@/app/lib/stripe'
import {
  connectStatusFromRestaurant,
  syncRestaurantConnectAccount,
} from '@/app/lib/stripe-connect'
import { BillingConnectPanel } from '@/app/components/billing/BillingConnectPanel'

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; refresh?: string }>
}) {
  const session = await getSession()
  if (!session) return null

  const params = await searchParams

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.restaurantId },
  })

  let connectStatus = restaurant
    ? connectStatusFromRestaurant(restaurant)
    : {
        accountId: null,
        detailsSubmitted: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        ready: false,
      }

  const stripe = getStripe()
  if (restaurant?.stripe_account_id && stripe) {
    try {
      connectStatus = await syncRestaurantConnectAccount(
        stripe,
        restaurant.id,
        restaurant.stripe_account_id
      )
    } catch {
      /* keep saved status if Stripe is unreachable */
    }
  }

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
        <p className="text-slate-300">Platform fee: {formatPence(commission._sum.commission_pence ?? 0)}</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="font-semibold text-white mb-2">Stripe Connect</h2>
        <BillingConnectPanel
          initial={connectStatus}
          stripeConfigured={stripeConfigured()}
          returnedFromStripe={params.connected === 'true'}
          resumeOnboarding={params.refresh === 'true'}
        />
      </div>
    </div>
  )
}
