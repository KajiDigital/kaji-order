import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import {
  attributeSetInclude,
  createAttributeSet,
  serializeAttributeSet,
  type AttributeSetInput,
} from '@/app/lib/attribute-sets'
import { queueKajiCloudMenuSync } from '@/app/lib/kaji-cloud-sync'
import prisma from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sets = await prisma.attributeSet.findMany({
    where: { restaurant_id: session.restaurantId },
    orderBy: { sort_order: 'asc' },
    include: attributeSetInclude,
  })

  return NextResponse.json({
    attribute_sets: sets.map(serializeAttributeSet),
  })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json()) as AttributeSetInput
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 })
  }

  const set = await createAttributeSet(session.restaurantId, {
    ...body,
    name: body.name.trim(),
  })

  const serialized = serializeAttributeSet(set)
  await queueKajiCloudMenuSync(session.restaurantId, {
    change_type: 'attribute_set_create',
    entity_id: set.id,
    data: serialized,
  })

  return NextResponse.json({ attribute_set: serialized })
}
