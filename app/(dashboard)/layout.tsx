export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getSession } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'
import { DashboardShell } from '@/app/components/dashboard/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.restaurantId },
    select: { status: true },
  })

  if (restaurant?.status !== 'active') {
    redirect('/login')
  }

  return <DashboardShell session={session}>{children}</DashboardShell>
}
