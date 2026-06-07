import prisma from './prisma'

export async function getNextOrderNumber(restaurantId: string): Promise<number> {
  const last = await prisma.onlineOrder.findFirst({
    where: { restaurant_id: restaurantId },
    orderBy: { order_number: 'desc' },
    select: { order_number: true },
  })
  return (last?.order_number ?? 0) + 1
}

export async function verifyOrderOwnership(
  orderId: string,
  restaurantId: string
) {
  return prisma.onlineOrder.findFirst({
    where: { id: orderId, restaurant_id: restaurantId },
    include: { items: true, restaurant: true },
  })
}
