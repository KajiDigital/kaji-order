import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import {
  deleteMenuTag,
  menuTagInclude,
  serializeMenuTag,
  updateMenuTag,
  type MenuTagInput,
} from '@/app/lib/menu-tags'
import { queueKajiCloudMenuSync } from '@/app/lib/kaji-cloud-sync'
import prisma from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = (await request.json()) as Partial<MenuTagInput>

  const updated = await updateMenuTag(id, session.restaurantId, body)
  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const serialized = serializeMenuTag(updated)
  await queueKajiCloudMenuSync(session.restaurantId, {
    change_type: 'menu_tag_update',
    entity_id: id,
    data: serialized,
  })

  return NextResponse.json({ tag: serialized })
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const ok = await deleteMenuTag(id, session.restaurantId)
  if (!ok) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await queueKajiCloudMenuSync(session.restaurantId, {
    change_type: 'menu_tag_delete',
    entity_id: id,
    data: { id },
  })

  return NextResponse.json({ ok: true })
}

export async function GET(_request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const tag = await prisma.menuTag.findFirst({
    where: { id, restaurant_id: session.restaurantId },
    include: menuTagInclude,
  })
  if (!tag) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ tag: serializeMenuTag(tag) })
}
