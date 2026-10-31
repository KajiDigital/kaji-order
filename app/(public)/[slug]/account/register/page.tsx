import { notFound } from 'next/navigation'
import { findActiveRestaurantBySlug } from '@/app/lib/customer-auth'
import { getPrimaryColor } from '@/app/lib/branding'
import { AccountShell } from '../AccountShell'
import { RegisterForm } from './RegisterForm'

export const dynamic = 'force-dynamic'

export default async function CustomerRegisterPage({
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
      title="Create account"
    >
      <RegisterForm slug={restaurant.slug} primary={getPrimaryColor(restaurant)} />
    </AccountShell>
  )
}
