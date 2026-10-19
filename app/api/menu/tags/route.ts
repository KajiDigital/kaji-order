import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import {
  createMenuTag,
  ensureDefaultMenuTags,
  menuTagInclude,
  MENU_TAG_KINDS,
  serializeMenuTag,
  type MenuTagInput,
  type MenuTagKind,
} from '@/app/lib/menu-tags'
import { queueKajiCloudMenuSync } from '@/app/lib/kaji-cloud-sync'
import prisma from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

function parseKind(value: unknown): MenuTagKind | null {
  if (typeof value !== 'string') return null
  return MENU_TAG_KINDS.includes(value as MenuTagKind) ? (value as MenuTagKind) : null
}

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const kindParam = searchParams.get('kind')
  const kind = kindParam ? parseKind(kindParam) : null

  await ensureDefaultMenuTags(session.restaurantId)

  const tags = await prisma.menuTag.findMany({
    where: {
      restaurant_id: session.restaurantId,
      ...(kind ? { kind } : {}),
    },
    orderBy: [{ kind: 'asc' }, { sort_order: 'asc' }],
    include: menuTagInclude,
  })

  const dietary_tags = tags.filter((t) => t.kind === 'DIETARY').map(serializeMenuTag)
  const allergen_tags = tags.filter((t) => t.kind === 'ALLERGEN').map(serializeMenuTag)

  return NextResponse.json({
    tags: tags.map(serializeMenuTag),
    dietary_tags,
    allergen_tags,
  })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json()) as MenuTagInput
  const kind = parseKind(body.kind)
  if (!kind) {
    return NextResponse.json({ error: 'Valid kind required' }, { status: 400 })
  }
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 })
  }

  const tag = await createMenuTag(session.restaurantId, {
    ...body,
    kind,
    name: body.name.trim(),
  })

  const serialized = serializeMenuTag(tag)
  await queueKajiCloudMenuSync(session.restaurantId, {
    change_type: 'menu_tag_create',
    entity_id: tag.id,
    data: serialized,
  })

  return NextResponse.json({ tag: serialized })
}
