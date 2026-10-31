export const dynamic = 'force-dynamic'

import prisma from '@/app/lib/prisma'
import { AdminCustomersClient } from '@/app/components/admin/AdminCustomersClient'

export default async function AdminCustomersPage() {
  const restaurants = await prisma.restaurant.findMany({
    where: { deleted_at: null },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true },
  })

  return <AdminCustomersClient restaurants={restaurants} />
}
