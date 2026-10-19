import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import { linkTagToItem } from '@/app/lib/menu-tags'
import { queueKajiCloudMenuSync } from '@/app/lib/kaji-cloud-sync'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: menuItemId } = await params
  const body = await request.json()
  const tagId = typeof body.tag_id === 'string' ? body.tag_id : ''

  if (!tagId) {
    return NextResponse.json({ error: 'tag_id required' }, { status: 400 })
  }

  const link = await linkTagToItem(menuItemId, tagId, session.restaurantId)
  if (!link) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await queueKajiCloudMenuSync(session.restaurantId, {
    change_type: 'item_tag_link',
    entity_id: menuItemId,
    data: { menu_item_id: menuItemId, tag_id: tagId, sort_order: link.sort_order },
  })

  return NextResponse.json({
    link: {
      menu_item_id: link.menu_item_id,
      tag_id: link.tag_id,
      sort_order: link.sort_order,
    },
  })
}
