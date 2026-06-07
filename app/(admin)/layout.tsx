export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getAdminSession } from '@/app/lib/admin-auth'
import { AdminShell } from '@/app/components/admin/AdminShell'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await getAdminSession()
  if (!admin) redirect('/admin-login')

  return <AdminShell admin={admin}>{children}</AdminShell>
}
