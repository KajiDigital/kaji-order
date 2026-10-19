import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import { unlinkTagFromItem } from '@/app/lib/menu-tags'
import { queueKajiCloudMenuSync } from '@/app/lib/kaji-cloud-sync'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string; tagId: string }> }

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: menuItemId, tagId } = await params

  const ok = await unlinkTagFromItem(menuItemId, tagId, session.restaurantId)
  if (!ok) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await queueKajiCloudMenuSync(session.restaurantId, {
    change_type: 'item_tag_unlink',
    entity_id: menuItemId,
    data: { menu_item_id: menuItemId, tag_id: tagId },
  })

  return NextResponse.json({ ok: true })
}
