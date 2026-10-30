import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'
import { getStripe } from '@/app/lib/stripe'
import {
  createRestaurantConnectAccount,
  persistConnectStatus,
  stripeErrorMessage,
  syncRestaurantConnectAccount,
} from '@/app/lib/stripe-connect'
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
      { error: 'Stripe is not configured yet. Contact Kaji support.' },
      { status: 503 }
    )
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.restaurantId },
  })

  if (!restaurant) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    let accountId = restaurant.stripe_account_id

    if (!accountId) {
      const account = await createRestaurantConnectAccount(
        stripe,
        restaurant,
        restaurant.email ?? session.email
      )
      accountId = account.id
      await persistConnectStatus(restaurant.id, account)
    }

    const status = await syncRestaurantConnectAccount(stripe, restaurant.id, accountId)

    if (status.ready) {
      return NextResponse.json({
        ready: true,
        accountId: status.accountId,
        payoutsEnabled: status.payoutsEnabled,
      })
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${getAppUrl()}/dashboard/billing?refresh=true`,
      return_url: `${getAppUrl()}/dashboard/billing?connected=true`,
      type: 'account_onboarding',
    })

    return NextResponse.json({
      url: accountLink.url,
      accountId,
      ready: false,
    })
  } catch (error) {
    console.error('[stripe/connect]', error)
    return NextResponse.json({ error: stripeErrorMessage(error) }, { status: 500 })
  }
}
