import { notFound, redirect } from 'next/navigation'
import prisma from '@/app/lib/prisma'
import { customerOrdersWhere, findActiveRestaurantBySlug, getCustomerSession } from '@/app/lib/customer-auth'
import { getPrimaryColor } from '@/app/lib/branding'
import { AccountShell } from './AccountShell'
import { AccountDashboard } from './AccountDashboard'

export const dynamic = 'force-dynamic'

export default async function CustomerAccountPage({
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

  const where = customerOrdersWhere(session.restaurantId, session.customerId, session.email)
  const [orders, totalOrders] = await Promise.all([
    prisma.onlineOrder.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 1,
      include: {
        items: { select: { id: true, name: true, quantity: true, total_price: true } },
      },
    }),
    prisma.onlineOrder.count({ where }),
  ])

  return (
    <AccountShell
      slug={restaurant.slug}
      restaurantName={restaurant.name}
      primaryColor={restaurant.primary_color}
      logoUrl={restaurant.logo_url}
      title="Your account"
      signedIn
    >
      <AccountDashboard
        slug={restaurant.slug}
        restaurantName={restaurant.name}
        name={session.name}
        primary={getPrimaryColor(restaurant)}
        totalOrders={totalOrders}
        orders={orders.map((order) => ({
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          order_type: order.order_type,
          total_pence: order.total_pence,
          created_at: order.created_at.toISOString(),
          items: order.items,
        }))}
      />
    </AccountShell>
  )
}
