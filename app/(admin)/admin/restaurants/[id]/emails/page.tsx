export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import prisma from '@/app/lib/prisma'
import { EmailTemplateEditor } from '@/app/components/admin/EmailTemplateEditor'

type Params = { params: Promise<{ id: string }> }

export default async function AdminRestaurantEmailsPage({ params }: Params) {
  const { id } = await params

  const restaurant = await prisma.restaurant.findFirst({
    where: { id, deleted_at: null },
    select: { id: true, name: true },
  })

  if (!restaurant) notFound()

  return (
    <EmailTemplateEditor
      restaurantId={restaurant.id}
      restaurantName={restaurant.name}
    />
  )
}
