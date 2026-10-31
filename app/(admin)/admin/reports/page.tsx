export const dynamic = 'force-dynamic'

import prisma from '@/app/lib/prisma'
import { AdminReportsClient } from '@/app/components/admin/AdminReportsClient'

export default async function AdminReportsPage() {
  const restaurants = await prisma.restaurant.findMany({
    where: { deleted_at: null },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  return <AdminReportsClient restaurants={restaurants} />
}
