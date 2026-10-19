import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import {
  attributeSetInclude,
  serializeAttributeSet,
  updateAttributeSet,
  type AttributeSetInput,
} from '@/app/lib/attribute-sets'
import { queueKajiCloudMenuSync } from '@/app/lib/kaji-cloud-sync'
import prisma from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const set = await prisma.attributeSet.findFirst({
    where: { id, restaurant_id: session.restaurantId },
    include: attributeSetInclude,
  })

  if (!set) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ attribute_set: serializeAttributeSet(set) })
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = (await request.json()) as AttributeSetInput

  const set = await updateAttributeSet(id, session.restaurantId, body)
  if (!set) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const serialized = serializeAttributeSet(set)
  await queueKajiCloudMenuSync(session.restaurantId, {
    change_type: 'attribute_set_update',
    entity_id: id,
    data: serialized,
  })

  return NextResponse.json({ attribute_set: serialized })
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.attributeSet.findFirst({
    where: { id, restaurant_id: session.restaurantId },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.attributeSet.delete({ where: { id } })

  await queueKajiCloudMenuSync(session.restaurantId, {
    change_type: 'attribute_set_delete',
    entity_id: id,
    data: { id },
  })

  return NextResponse.json({ ok: true })
}
