import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import { linkAttributeSetToItem } from '@/app/lib/attribute-sets'
import { queueKajiCloudMenuSync } from '@/app/lib/kaji-cloud-sync'
import prisma from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: menuItemId } = await params
  const body = await request.json()
  const attributeSetId =
    typeof body.attribute_set_id === 'string' ? body.attribute_set_id : ''

  if (!attributeSetId) {
    return NextResponse.json({ error: 'attribute_set_id required' }, { status: 400 })
  }

  const link = await linkAttributeSetToItem(
    menuItemId,
    attributeSetId,
    session.restaurantId
  )

  if (!link) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await queueKajiCloudMenuSync(session.restaurantId, {
    change_type: 'item_attribute_link',
    entity_id: menuItemId,
    data: {
      menu_item_id: menuItemId,
      attribute_set_id: attributeSetId,
      sort_order: link.sort_order,
    },
  })

  return NextResponse.json({
    link: {
      menu_item_id: link.menu_item_id,
      attribute_set_id: link.attribute_set_id,
      sort_order: link.sort_order,
    },
  })
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: menuItemId } = await params
  const body = await request.json()
  const links = Array.isArray(body.links) ? body.links : []

  const item = await prisma.menuItem.findFirst({
    where: { id: menuItemId, restaurant_id: session.restaurantId },
  })
  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  for (const entry of links) {
    if (typeof entry.attribute_set_id !== 'string') continue
    await prisma.menuItemAttributeSet.updateMany({
      where: {
        menu_item_id: menuItemId,
        attribute_set_id: entry.attribute_set_id,
      },
      data: {
        sort_order: typeof entry.sort_order === 'number' ? entry.sort_order : 0,
      },
    })
  }

  await queueKajiCloudMenuSync(session.restaurantId, {
    change_type: 'item_attribute_reorder',
    entity_id: menuItemId,
    data: { menu_item_id: menuItemId, links },
  })

  return NextResponse.json({ ok: true })
}
