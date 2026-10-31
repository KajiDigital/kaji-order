import { notFound, redirect } from 'next/navigation'
import { findActiveRestaurantBySlug, getCustomerSession } from '@/app/lib/customer-auth'
import { getPrimaryColor } from '@/app/lib/branding'
import { AccountShell } from '../AccountShell'
import { AccountDetailsForm } from './AccountDetailsForm'

export const dynamic = 'force-dynamic'

export default async function AccountDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const restaurant = await findActiveRestaurantBySlug(slug)
  if (!restaurant) notFound()

  const session = await getCustomerSession()
  if (!session || session.slug !== slug) {
    redirect(`/${slug}/account/login`)
  }

  return (
    <AccountShell
      slug={restaurant.slug}
      restaurantName={restaurant.name}
      primaryColor={restaurant.primary_color}
      logoUrl={restaurant.logo_url}
      title="Account details"
      signedIn
    >
      <AccountDetailsForm
        slug={restaurant.slug}
        name={session.name}
        email={session.email}
        phone={session.phone}
        primary={getPrimaryColor(restaurant)}
        addresses={session.addresses.map((address) => ({
          id: address.id,
          address: address.address,
          postcode: address.postcode,
        }))}
      />
    </AccountShell>
  )
}
