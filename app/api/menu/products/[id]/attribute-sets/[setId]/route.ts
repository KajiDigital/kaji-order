import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import { unlinkAttributeSetFromItem } from '@/app/lib/attribute-sets'
import { queueKajiCloudMenuSync } from '@/app/lib/kaji-cloud-sync'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string; setId: string }> }

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: menuItemId, setId: attributeSetId } = await params

  const ok = await unlinkAttributeSetFromItem(
    menuItemId,
    attributeSetId,
    session.restaurantId
  )

  if (!ok) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await queueKajiCloudMenuSync(session.restaurantId, {
    change_type: 'item_attribute_unlink',
    entity_id: menuItemId,
    data: { menu_item_id: menuItemId, attribute_set_id: attributeSetId },
  })

  return NextResponse.json({ ok: true })
}
