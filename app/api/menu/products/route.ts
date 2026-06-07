import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import prisma from '@/app/lib/prisma'
import { parsePoundsToPence } from '@/app/lib/utils'

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
    include: {
      modifier_groups: {
        orderBy: { sort_order: 'asc' },
        include: { modifiers: { orderBy: { sort_order: 'asc' } } },
      },
    },
  })

  return NextResponse.json({ products })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const {
    category_id,
    name,
    description,
    price_pence,
    price,
    image_url,
    is_available,
    modifier_groups,
  } = body

  if (!category_id || !name) {
    return NextResponse.json({ error: 'Category and name required' }, { status: 400 })
  }

  const pence = price_pence ?? parsePoundsToPence(price ?? 0)

  const product = await prisma.menuItem.create({
    data: {
      restaurant_id: session.restaurantId,
      category_id,
      name,
      description: description ?? null,
      price_pence: pence,
      image_url: image_url ?? null,
      is_available: is_available ?? true,
      modifier_groups: modifier_groups?.length
        ? {
            create: modifier_groups.map(
              (
                g: {
                  name: string
                  required?: boolean
                  min_select?: number
                  max_select?: number
                  modifiers?: { name: string; price_delta_pence?: number; price?: number; is_default?: boolean }[]
                },
                gi: number
              ) => ({
                restaurant_id: session.restaurantId,
                name: g.name,
                required: g.required ?? false,
                min_select: g.min_select ?? 0,
                max_select: g.max_select ?? 1,
                sort_order: gi,
                modifiers: {
                  create: (g.modifiers ?? []).map((m, mi) => ({
                    name: m.name,
                    price_delta_pence:
                      m.price_delta_pence ?? parsePoundsToPence(m.price ?? 0),
                    is_default: m.is_default ?? false,
                    sort_order: mi,
                  })),
                },
              })
            ),
          }
        : undefined,
    },
    include: {
      modifier_groups: { include: { modifiers: true } },
    },
  })

  return NextResponse.json({ product })
}
