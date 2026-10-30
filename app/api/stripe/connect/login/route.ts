import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'
import { getStripe } from '@/app/lib/stripe'
import { syncRestaurantConnectAccount } from '@/app/lib/stripe-connect'

export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured yet.' }, { status: 503 })
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.restaurantId },
    select: { id: true, stripe_account_id: true },
  })

  if (!restaurant?.stripe_account_id) {
    return NextResponse.json({ error: 'Stripe is not connected yet.' }, { status: 400 })
  }

  try {
    const status = await syncRestaurantConnectAccount(
      stripe,
      restaurant.id,
      restaurant.stripe_account_id
    )
    if (!status.detailsSubmitted) {
      return NextResponse.json(
        { error: 'Finish Stripe setup before opening the dashboard.' },
        { status: 400 }
      )
    }

    const login = await stripe.accounts.createLoginLink(restaurant.stripe_account_id)
    return NextResponse.json({ url: login.url })
  } catch (error) {
    console.error('[stripe/connect/login]', error)
    return NextResponse.json(
      { error: 'Could not open the Stripe dashboard. Try again.' },
      { status: 500 }
    )
  }
}
