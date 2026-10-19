import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'
import {
  fetchMenuItemById,
  parseMenuItemFields,
  replaceComboGroups,
  replaceOptionGroups,
  serializeMenuItem,
} from '@/app/lib/menu-api'
import { queueKajiCloudMenuSync } from '@/app/lib/kaji-cloud-sync'

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

  const fields = parseMenuItemFields(body)
  if (body.is_bundle === true) {
    fields.pricing_type = 'BUNDLE'
  }

  const { category_id, ...updateFields } = fields

  await prisma.menuItem.update({
    where: { id },
    data: {
      ...updateFields,
      ...(category_id !== undefined && { category_id }),
    } as Prisma.MenuItemUncheckedUpdateInput,
  })

  if (body.option_groups !== undefined) {
    await replaceOptionGroups(id, body.option_groups)
  }
  if (body.combo_groups !== undefined) {
    await replaceComboGroups(id, body.combo_groups)
  }

  const updated = await fetchMenuItemById(id, session.restaurantId)
  if (updated) {
    await queueKajiCloudMenuSync(session.restaurantId, {
      change_type: 'product_update',
      entity_id: id,
      data: serializeMenuItem(updated),
    })
  }
  return NextResponse.json({ product: updated })
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
  await queueKajiCloudMenuSync(session.restaurantId, {
    change_type: 'product_delete',
    entity_id: id,
    data: { id },
  })
  return NextResponse.json({ ok: true })
}
