import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'
import { getStripe } from '@/app/lib/stripe'
import { getAppUrl } from '@/app/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe not configured', setupLater: true },
      { status: 503 }
    )
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.restaurantId },
  })

  if (!restaurant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (restaurant.stripe_account_id) {
    return NextResponse.json({
      connected: true,
      accountId: restaurant.stripe_account_id,
    })
  }

  const account = await stripe.accounts.create({
    type: 'express',
    country: 'GB',
    email: restaurant.email ?? session.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: { restaurant_id: restaurant.id },
  })

  await prisma.restaurant.update({
    where: { id: restaurant.id },
    data: { stripe_account_id: account.id },
  })

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${getAppUrl()}/dashboard/billing?refresh=true`,
    return_url: `${getAppUrl()}/dashboard/billing?connected=true`,
    type: 'account_onboarding',
  })

  return NextResponse.json({ url: accountLink.url })
}
