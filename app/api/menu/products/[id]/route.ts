import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'
import { parsePoundsToPence } from '@/app/lib/utils'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  const existing = await prisma.menuItem.findFirst({
    where: { id, restaurant_id: session.restaurantId },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const product = await prisma.menuItem.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.category_id !== undefined && { category_id: body.category_id }),
      ...(body.price_pence !== undefined && { price_pence: body.price_pence }),
      ...(body.price !== undefined && { price_pence: parsePoundsToPence(body.price) }),
      ...(body.image_url !== undefined && { image_url: body.image_url }),
      ...(body.is_available !== undefined && { is_available: body.is_available }),
      ...(body.sort_order !== undefined && { sort_order: body.sort_order }),
    },
    include: {
      modifier_groups: { include: { modifiers: true } },
    },
  })

  if (body.modifier_groups) {
    await prisma.modifierGroup.deleteMany({ where: { menu_item_id: id } })
    for (const [gi, g] of body.modifier_groups.entries()) {
      await prisma.modifierGroup.create({
        data: {
          restaurant_id: session.restaurantId,
          menu_item_id: id,
          name: g.name,
          required: g.required ?? false,
          min_select: g.min_select ?? 0,
          max_select: g.max_select ?? 1,
          sort_order: gi,
          modifiers: {
            create: (g.modifiers ?? []).map(
              (m: { name: string; price_delta_pence?: number; price?: number; is_default?: boolean }, mi: number) => ({
                name: m.name,
                price_delta_pence: m.price_delta_pence ?? parsePoundsToPence(m.price ?? 0),
                is_default: m.is_default ?? false,
                sort_order: mi,
              })
            ),
          },
        },
      })
    }
  }

  const updated = await prisma.menuItem.findUnique({
    where: { id },
    include: {
      modifier_groups: { include: { modifiers: true } },
    },
  })

  return NextResponse.json({ product: updated ?? product })
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.menuItem.findFirst({
    where: { id, restaurant_id: session.restaurantId },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.menuItem.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
