import type Stripe from 'stripe'
import prisma from '@/app/lib/prisma'
import { getAppUrl } from '@/app/lib/utils'

type RestaurantConnectInput = {
  id: string
  name: string
  slug: string
  email?: string | null
}

export function stripeErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  return 'Could not start Stripe onboarding. Try again.'
}

function publicMenuUrl(slug: string): string | undefined {
  try {
    const appUrl = getAppUrl()
    const parsed = new URL(appUrl)
    if (parsed.protocol !== 'https:') return undefined
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') return undefined
    return `${appUrl.replace(/\/$/, '')}/${slug}`
  } catch {
    return undefined
  }
}

async function createExpressStyleAccount(
  stripe: Stripe,
  restaurant: RestaurantConnectInput,
  email: string
): Promise<Stripe.Account> {
  const url = publicMenuUrl(restaurant.slug)
  return stripe.accounts.create({
    country: 'GB',
    email,
    controller: {
      stripe_dashboard: { type: 'express' },
      fees: { payer: 'application' },
      losses: { payments: 'application' },
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: { restaurant_id: restaurant.id },
    business_profile: {
      name: restaurant.name,
      product_description: 'Online restaurant ordering',
      ...(url ? { url } : {}),
    },
  })
}

async function createManagedRiskAccount(
  stripe: Stripe,
  restaurant: RestaurantConnectInput,
  email: string
): Promise<Stripe.Account> {
  const url = publicMenuUrl(restaurant.slug)
  const created = await stripe.v2.core.accounts.create({
    contact_email: email,
    display_name: restaurant.name,
    dashboard: 'full',
    identity: {
      country: 'GB',
      entity_type: 'company',
      business_details: { registered_name: restaurant.name },
    },
    defaults: {
      currency: 'gbp',
      responsibilities: {
        fees_collector: 'stripe',
        losses_collector: 'stripe',
      },
      profile: {
        doing_business_as: restaurant.name,
        product_description: 'Online restaurant ordering',
        ...(url ? { business_url: url } : {}),
      },
    },
    configuration: {
      merchant: {
        capabilities: { card_payments: { requested: true } },
      },
      recipient: {
        capabilities: {
          stripe_balance: { stripe_transfers: { requested: true } },
        },
      },
    },
    metadata: { restaurant_id: restaurant.id },
    include: [
      'configuration.merchant',
      'configuration.recipient',
      'defaults',
      'identity',
      'requirements',
    ],
  })
  return stripe.accounts.retrieve(created.id)
}

export async function createRestaurantConnectAccount(
  stripe: Stripe,
  restaurant: RestaurantConnectInput,
  email: string
): Promise<Stripe.Account> {
  try {
    return await createExpressStyleAccount(stripe, restaurant, email)
  } catch (error) {
    const message = stripeErrorMessage(error)
    const needsV2 =
      /Accounts v2|losses_collector|losses collector|legacy `type`/i.test(message)
    if (!needsV2) throw error
    console.warn('[stripe/connect] Express-style create rejected, retrying Accounts v2:', message)
    return createManagedRiskAccount(stripe, restaurant, email)
  }
}

export type StripeConnectStatus = {
  accountId: string | null
  detailsSubmitted: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
  ready: boolean
}

export function connectStatusFromAccount(account: Stripe.Account): StripeConnectStatus {
  const detailsSubmitted = Boolean(account.details_submitted)
  const chargesEnabled = Boolean(account.charges_enabled)
  const payoutsEnabled = Boolean(account.payouts_enabled)
  return {
    accountId: account.id,
    detailsSubmitted,
    chargesEnabled,
    payoutsEnabled,
    ready: chargesEnabled && detailsSubmitted,
  }
}

export function connectStatusFromRestaurant(restaurant: {
  stripe_account_id: string | null
  stripe_details_submitted: boolean
  stripe_charges_enabled: boolean
  stripe_payouts_enabled: boolean
}): StripeConnectStatus {
  return {
    accountId: restaurant.stripe_account_id,
    detailsSubmitted: restaurant.stripe_details_submitted,
    chargesEnabled: restaurant.stripe_charges_enabled,
    payoutsEnabled: restaurant.stripe_payouts_enabled,
    ready: restaurant.stripe_charges_enabled && restaurant.stripe_details_submitted,
  }
}

export async function persistConnectStatus(
  restaurantId: string,
  account: Stripe.Account
): Promise<StripeConnectStatus> {
  const status = connectStatusFromAccount(account)
  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      stripe_account_id: account.id,
      stripe_details_submitted: status.detailsSubmitted,
      stripe_charges_enabled: status.chargesEnabled,
      stripe_payouts_enabled: status.payoutsEnabled,
    },
  })
  return status
}

export async function syncRestaurantConnectAccount(
  stripe: Stripe,
  restaurantId: string,
  accountId: string
): Promise<StripeConnectStatus> {
  const account = await stripe.accounts.retrieve(accountId)
  return persistConnectStatus(restaurantId, account)
}
