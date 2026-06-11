import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'
import {
  fetchMenuItemById,
  menuItemInclude,
  parseMenuItemFields,
  replaceComboGroups,
  replaceOptionGroups,
} from '@/app/lib/menu-api'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const categoryId = searchParams.get('categoryId')

  const products = await prisma.menuItem.findMany({
    where: {
      restaurant_id: session.restaurantId,
      ...(categoryId ? { category_id: categoryId } : {}),
    },
    orderBy: { sort_order: 'asc' },
    include: menuItemInclude,
  })

  return NextResponse.json({ products })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { category_id, name, option_groups, combo_groups } = body

  if (!category_id || !name) {
    return NextResponse.json({ error: 'Category and name required' }, { status: 400 })
  }

  const fields = parseMenuItemFields(body)
  if (fields.base_price === undefined) {
    return NextResponse.json({ error: 'Price required' }, { status: 400 })
  }

  const product = await prisma.menuItem.create({
    data: {
      restaurant_id: session.restaurantId,
      category_id,
      name: String(body.name),
      ...fields,
      base_price: fields.base_price!,
      pricing_type: body.is_bundle ? 'BUNDLE' : (fields.pricing_type ?? 'OPTIONS'),
    } as Prisma.MenuItemUncheckedCreateInput,
  })

  if (option_groups?.length) {
    await replaceOptionGroups(product.id, option_groups)
  }
  if (combo_groups?.length) {
    await replaceComboGroups(product.id, combo_groups)
  }

  const updated = await fetchMenuItemById(product.id, session.restaurantId)
  return NextResponse.json({ product: updated })
}
