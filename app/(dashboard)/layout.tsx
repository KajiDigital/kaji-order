export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getSession } from '@/app/lib/auth'
import { DashboardShell } from '@/app/components/dashboard/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  return <DashboardShell session={session}>{children}</DashboardShell>
}
