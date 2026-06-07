export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getSession } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'
import { getImpersonationInfo } from '@/app/lib/impersonation'
import { DashboardShell } from '@/app/components/dashboard/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const impersonating = await getImpersonationInfo()

  if (!impersonating) {
    const restaurant = await prisma.restaurant.findFirst({
      where: { id: session.restaurantId, deleted_at: null },
      select: { status: true },
    })

    if (restaurant?.status !== 'active') {
      redirect('/login')
    }
  }

  return (
    <DashboardShell session={session} impersonating={impersonating}>
      {children}
    </DashboardShell>
  )
}
