import { notFound } from 'next/navigation'
import { findActiveRestaurantBySlug } from '@/app/lib/customer-auth'
import { AccountShell } from '../account/AccountShell'

export const dynamic = 'force-dynamic'

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const restaurant = await findActiveRestaurantBySlug(slug)
  if (!restaurant) notFound()

  return (
    <AccountShell
      slug={restaurant.slug}
      restaurantName={restaurant.name}
      primaryColor={restaurant.primary_color}
      logoUrl={restaurant.logo_url}
      title="Privacy"
    >
      <h1 className="text-2xl font-bold text-stone-900">Privacy</h1>
      <div className="mt-4 space-y-4 text-sm leading-6 text-stone-600">
        <p>
          {restaurant.name} uses your name, email, phone and delivery details to take
          your order, contact you about it, and keep a record of the sale.
        </p>
        <p>
          If you create an account, we also store a password so you can see past orders
          and check out faster next time. You can delete that account at any time.
        </p>
        <p>
          Guest orders do not require an account. Deleting an account does not remove
          the restaurant&apos;s order records, but personal login details are removed
          and order contact details are anonymised.
        </p>
      </div>
    </AccountShell>
  )
}
